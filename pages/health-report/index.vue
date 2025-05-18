<template>
  <view class="health-report">
    <!-- 顶部安全区域 -->
    <view class="safe-area"></view>

    <!-- 顶部标题 -->
    <view class="header">
      <view class="back-btn" @click="navigateBack()">
        <image src="/static/icons/back.png"></image>
      </view>
      <text class="title">健康报告</text>
    </view>

    <!-- 日期选择器移至此处 -->
    <view class="date-selector">
      <view class="date-actions">
        <view class="date-arrow" @click="changeDate(-1)">
          <image src="/static/icons/arrow-left.png"></image>
        </view>
        <picker mode="date" :value="datePickerValue" :start="startDate" :end="endDate" @change="onDateChange">
          <view class="date-display">
            <text class="date-title">{{ dateTitle }}</text>
            <text class="date-value">{{ formattedDate }}</text>
          </view>
        </picker>
        <view class="date-arrow" @click="changeDate(1)">
          <image src="/static/icons/arrow-right.png"></image>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="isLoading" class="loading-container">
      <view class="loading-box">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <view v-else class="content-container">
      <!-- 健康评分卡片 -->
      <view class="health-score card">
        <view class="section-header">
          <text class="section-title">健康评分</text>
          <text class="date-info">{{ formattedDate }}</text>
        </view>

        <view class="score-container">
          <view class="score-circle">
            <view class="score-value">{{ healthReport.healthScore }}</view>
            <view class="score-desc">健康评分</view>
          </view>

          <view class="score-change">
            <view class="change-value" :class="{ 'positive': healthReport.scoreChange > 0, 'negative': healthReport.scoreChange < 0 }">
              <text>{{ healthReport.scoreChange > 0 ? '+' : '' }}{{ healthReport.scoreChange }}</text>
              <view class="change-icon">
                <image :src="healthReport.scoreChange >= 0 ? '/static/icons/up.png' : '/static/icons/down.png'"></image>
              </view>
            </view>
            <text class="change-label">较上周</text>
          </view>
        </view>
      </view>

      <!-- 营养平衡雷达图 -->
      <view class="nutrition-balance card">
        <view class="section-header">
          <text class="section-title">营养平衡</text>
        </view>

        <view class="radar-container">
          <!-- 使用秋云ucharts组件替换原canvas -->
          <!-- qiun-data-charts是uni_modules下的秋云图表组件，支持更丰富的功能和更好的兼容性 -->
          <qiun-data-charts
            type="radar"
            :opts="radarChartOpts"
            :chartData="radarChartData"
            canvasId="balanceRadar"
            ref="balanceRadar"
          />
        </view>

        <view class="radar-legend">
          <view class="legend-item" v-for="(item, index) in nutritionBalanceItems" :key="index">
            <view class="legend-color" :style="{ backgroundColor: item.color }"></view>
            <text class="legend-label">{{ item.label }}</text>
            <text class="legend-value">{{ item.value }}</text>
          </view>
        </view>
      </view>

      <!-- 营养周对比卡片 -->
      <view class="nutrition-compare card">
        <view class="section-header">
          <text class="section-title">本周 vs 上周</text>
        </view>

        <view class="compare-container">
          <view class="compare-item" v-for="(item, index) in weeklyCompareItems" :key="index">
            <view class="compare-header">
              <view class="compare-icon">
                <image :src="item.icon"></image>
              </view>
              <text class="compare-label">{{ item.label }}</text>
            </view>

            <view class="compare-data">
              <view class="data-col">
                <text class="data-value">{{ item.lastWeek }}</text>
                <text class="data-desc">上周</text>
              </view>

              <view class="direction-indicator">
                <view class="indicator-arrow" :class="{ 'increase': item.change > 0, 'decrease': item.change < 0, 'neutral': item.change === 0 }">
                  <image :src="getChangeIcon(item.change)"></image>
                </view>
                <text class="change-rate" :class="{ 'increase': item.change > 0, 'decrease': item.change < 0, 'neutral': item.change === 0 }">
                  {{ formatChange(item.change) }}
                </text>
              </view>

              <view class="data-col">
                <text class="data-value highlight">{{ item.thisWeek }}</text>
                <text class="data-desc">本周</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatDate } from '@/utils/date.js'
import { mapActions, mapGetters } from 'vuex'
// 移除原uCharts导入
// import uCharts from '@/components/u-charts/u-charts.js'
// 导入秋云ucharts组件
// qiun-data-charts是一个高性能的图表组件，支持各端平台，包括H5、小程序、APP等
import qiunDataCharts from "uni_modules/qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue"

export default {
  components: {
    qiunDataCharts
  },
  data() {
    return {
      selectedDate: new Date(),
      startDate: this.getDateMonthsAgo(3), // 三个月前
      endDate: new Date().toISOString().split('T')[0], // 今天
      formattedDate: '',
      // 移除radarChartInstance
      // radarChartInstance: null,
      radarColors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107'],
      // 数据缓存时间戳，用于判断是否需要重新获取数据
      lastDataFetchTime: 0,
      // 缓存刷新间隔，单位为毫秒（默认5分钟）
      dataCacheTime: 5 * 60 * 1000,

      // 添加雷达图配置
      radarChartOpts: {
        color: ['#4CAF50'],
        padding: [30, 30, 30, 30],
        legend: {
          show: false
        },
        dataLabel: true,
        extra: {
          radar: {
            gridType: 'polygon',
            gridColor: '#CCCCCC',
            labelColor: '#666666',
            max: 150
          }
        }
      },
      // 添加雷达图数据
      radarChartData: {
        categories: ['蛋白质', '碳水', '脂肪'],
        series: []
      },
      datePickerValue: ''
    }
  },
  computed: {
    ...mapGetters({
      healthReport: 'nutrition/healthReport',
      isLoading: 'nutrition/isLoading',
      dataChanged: 'nutrition/dataChanged' // 添加数据变更标志
    }),

    // 日期标题，显示今天/昨天/前天
    dateTitle() {
      // 判断是否是今天、昨天或前天
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const selectedDateObj = new Date(this.selectedDate)
      selectedDateObj.setHours(0, 0, 0, 0)

      const diffDays = Math.round((selectedDateObj - today) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return '今天'
      if (diffDays === -1) return '昨天'
      if (diffDays === -2) return '前天'

      return '' // 其他日期不显示特殊标题
    },

    // 格式化营养平衡数据
    nutritionBalanceItems() {
      const balance = this.healthReport.nutritionBalance || {};
      return [
        { label: '蛋白质', value: `${balance.protein || 0}%`, color: this.radarColors[0] },
        { label: '碳水化合物', value: `${balance.carbs || 0}%`, color: this.radarColors[1] },
        { label: '脂肪', value: `${balance.fat || 0}%`, color: this.radarColors[2] }
      ];
    },

    // 格式化每周对比数据
    weeklyCompareItems() {
      const weekly = this.healthReport.weeklyProgress || {};

      return [
        {
          label: '热量',
          icon: '/static/icons/calorie.png',
          lastWeek: weekly.calorie?.lastWeek || 0,
          thisWeek: weekly.calorie?.thisWeek || 0,
          change: this.calculateChange(weekly.calorie?.lastWeek || 0, weekly.calorie?.thisWeek || 0)
        },
        {
          label: '蛋白质',
          icon: '/static/icons/protein.png',
          lastWeek: weekly.protein?.lastWeek || 0,
          thisWeek: weekly.protein?.thisWeek || 0,
          change: this.calculateChange(weekly.protein?.lastWeek || 0, weekly.protein?.thisWeek || 0)
        },
        {
          label: '碳水',
          icon: '/static/icons/carbs.png',
          lastWeek: weekly.carbs?.lastWeek || 0,
          thisWeek: weekly.carbs?.thisWeek || 0,
          change: this.calculateChange(weekly.carbs?.lastWeek || 0, weekly.carbs?.thisWeek || 0)
        },
        {
          label: '脂肪',
          icon: '/static/icons/fat.png',
          lastWeek: weekly.fat?.lastWeek || 0,
          thisWeek: weekly.fat?.thisWeek || 0,
          change: this.calculateChange(weekly.fat?.lastWeek || 0, weekly.fat?.thisWeek || 0)
        }
      ];
    }
  },
  watch: {
    // 监听健康报告数据变化，更新雷达图
    'healthReport.nutritionBalance': {
      handler(newValue) {
        if (newValue) {
          this.updateRadarData()
        }
      },
      deep: true
    }
  },
  onLoad() {
    this.formattedDate = formatDate(this.selectedDate, 'yyyy年MM月dd日')
    this.datePickerValue = formatDate(this.selectedDate, 'yyyy-MM-dd') // 初始化日期选择器的值
    this.fetchHealthReportData()
      .then(() => {
        // 更新数据缓存时间戳
        this.lastDataFetchTime = Date.now()
      })
  },
  onReady() {
    // 不再需要手动初始化图表
    // setTimeout(() => {
    //   this.initRadarChart()
    // }, 300)
  },
  onPullDownRefresh() {
    // 下拉刷新
    this.fetchHealthReportData().then(() => {
      // 更新数据缓存时间戳
      this.lastDataFetchTime = Date.now()
      uni.stopPullDownRefresh()
    })
  },

  // 添加onShow生命周期，当从其他页面返回时更新数据
  onShow() {
    const currentTime = Date.now()
    const timeSinceLastFetch = currentTime - this.lastDataFetchTime

    // 检查是否需要刷新数据：首次加载、缓存过期或数据已变更
    if (this.lastDataFetchTime === 0 || timeSinceLastFetch > this.dataCacheTime || this.dataChanged) {
      // 如果是首次加载、缓存已过期或数据已变更，则重新获取数据
      console.log('健康报告：刷新数据', this.dataChanged ? '（数据已变更）' : '（缓存过期）')
      this.fetchHealthReportData()
        .then(() => {
          // 更新数据缓存时间戳
          this.lastDataFetchTime = Date.now()

          // 重置数据变更标志
          if (this.dataChanged) {
            this.$store.dispatch('nutrition/setDataChanged', false)
          }
        })
    } else {
      // 缓存有效，不重新请求数据
      console.log('健康报告：使用缓存数据，跳过网络请求')
    }
  },
  methods: {
    ...mapActions({
      fetchHealthReport: 'nutrition/fetchHealthReport'
    }),

    // 获取健康报告数据
    async fetchHealthReportData() {
      try {
        const dateStr = formatDate(this.selectedDate, 'yyyy-MM-dd')
        await this.fetchHealthReport({ date: dateStr })

        // 更新雷达图数据
        this.updateRadarData()

        return Promise.resolve()
      } catch (error) {
        console.error('获取健康报告数据失败', error)
        uni.showToast({
          title: '获取数据失败，请稍后重试',
          icon: 'none'
        })
        return Promise.reject(error)
      }
    },

    // 更新雷达图数据
    updateRadarData() {
      if (!this.healthReport.nutritionBalance) {
        return
      }

      const balance = this.healthReport.nutritionBalance

      this.radarChartData = {
        categories: ['蛋白质', '碳水', '脂肪'],
        series: [{
          name: '营养平衡',
          data: [
            balance.protein || 0,
            balance.carbs || 0,
            balance.fat || 0
          ]
        }]
      }
    },

    // 计算变化率
    calculateChange(lastWeek, thisWeek) {
      if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
      return ((thisWeek - lastWeek) / lastWeek) * 100;
    },

    // 格式化变化率
    formatChange(change) {
      if (change === 0) return '持平';
      return (change > 0 ? '+' : '') + change.toFixed(1) + '%';
    },

    // 获取变化图标
    getChangeIcon(change) {
      if (change > 0) return '/static/icons/up.png';
      if (change < 0) return '/static/icons/up.png'; // 使用up.png但在CSS中旋转
      return '/static/icons/equal.png';
    },

    // 显示日期选择器
    showDatePicker() {
      // 使用picker不需要特殊处理，点击日期文本时已经会自动显示
    },

    // 日期选择响应
    onDateChange(e) {
      this.selectedDate = new Date(e.detail.value);
      this.datePickerValue = e.detail.value;
      this.formattedDate = formatDate(this.selectedDate, 'yyyy年MM月dd日');
      this.fetchHealthReportData();
    },

    // 切换日期（上一天/下一天）
    changeDate(step) {
      const date = new Date(this.selectedDate);
      date.setDate(date.getDate() + step);

      // 不能超过今天
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        date.setTime(today.getTime());
      }

      // 不能早于开始日期
      const startDateObj = new Date(this.startDate);
      if (date < startDateObj) {
        date.setTime(startDateObj.getTime());
      }

      this.selectedDate = date;
      this.datePickerValue = formatDate(date, 'yyyy-MM-dd');
      this.formattedDate = formatDate(date, 'yyyy年MM月dd日');
      this.fetchHealthReportData();
    },

    // 获取几个月前的日期
    getDateMonthsAgo(months) {
      const date = new Date()
      date.setMonth(date.getMonth() - months)
      return date.toISOString().split('T')[0]
    },

    // 返回上一页
    navigateBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss">
.health-report {
  padding: 0 20rpx 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.safe-area {
  height: 80rpx;
  background-color: #f8f8f8;
}

.header {
  padding: 0 30rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  position: relative;

  .back-btn {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    justify-content: center;
    align-items: center;

    image {
      width: 36rpx;
      height: 36rpx;
    }
  }

  .title {
    flex: 1;
    text-align: center;
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;

    .loading-spinner {
      width: 60rpx;
      height: 60rpx;
      border: 4rpx solid #f3f3f3;
      border-top: 4rpx solid #4CAF50;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20rpx;
    }

    .loading-text {
      font-size: 28rpx;
      color: #666;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.content-container {
  padding-bottom: 30rpx;
}

.date-selector {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  margin: 0 20rpx 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  .date-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .date-arrow {
      width: 56rpx;
      height: 56rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f8f8f8;
      border-radius: 28rpx;

      image {
        width: 30rpx;
        height: 30rpx;
      }
    }

    .date-display {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .date-title {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 4rpx;
      }

      .date-value {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
}

.card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    position: relative;
    padding-left: 20rpx;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 8rpx;
      height: 32rpx;
      background-color: #4CAF50;
      border-radius: 4rpx;
    }
  }

  .date-info {
    font-size: 24rpx;
    color: #999;
  }
}

.health-score {
  .score-container {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 20rpx 0;

    .score-circle {
      width: 200rpx;
      height: 200rpx;
      border-radius: 100rpx;
      background: linear-gradient(135deg, #4CAF50, #8BC34A);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8rpx 16rpx rgba(76, 175, 80, 0.2);
      animation: pulse 2s infinite;

      .score-value {
        font-size: 60rpx;
        font-weight: bold;
        color: #fff;
        line-height: 1;
        margin-bottom: 10rpx;
      }

      .score-desc {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .score-change {
      display: flex;
      flex-direction: column;
      align-items: center;

      .change-value {
        display: flex;
        align-items: center;
        font-size: 48rpx;
        font-weight: bold;
        margin-bottom: 10rpx;

        &.positive {
          color: #4CAF50;
        }

        &.negative {
          color: #F44336;
        }

        .change-icon {
          width: 32rpx;
          height: 32rpx;
          margin-left: 8rpx;

          image {
            width: 100%;
            height: 100%;
          }
        }
      }

      .change-label {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 8rpx 16rpx rgba(76, 175, 80, 0.2);
  }
  50% {
    box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.4);
  }
  100% {
    box-shadow: 0 8rpx 16rpx rgba(76, 175, 80, 0.2);
  }
}

.nutrition-balance {
  .radar-container {
    height: 500rpx;
    display: flex;
    justify-content: center;
    align-items: center;

    // 不再需要
    // .radar-chart {
    //   width: 100%;
    //   height: 100%;
    // }
  }

  // 添加秋云图表组件样式
  :deep(.qiun-charts) {
    width: 100%;
    height: 500rpx;
  }

  .radar-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    margin-top: 30rpx;

    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      width: 30%;

      .legend-color {
        width: 20rpx;
        height: 20rpx;
        border-radius: 4rpx;
        margin-right: 10rpx;
      }

      .legend-label {
        font-size: 24rpx;
        color: #666;
        margin-right: 10rpx;
      }

      .legend-value {
        font-size: 24rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
}

.nutrition-compare {
  .compare-container {
    display: flex;
    flex-direction: column;

    .compare-item {
      margin-bottom: 30rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .compare-header {
        display: flex;
        align-items: center;
        margin-bottom: 15rpx;

        .compare-icon {
          width: 40rpx;
          height: 40rpx;
          margin-right: 10rpx;

          image {
            width: 100%;
            height: 100%;
          }
        }

        .compare-label {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }
      }

      .compare-data {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f9f9f9;
        border-radius: 12rpx;
        padding: 20rpx;

        .data-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 30%;

          .data-value {
            font-size: 32rpx;
            color: #666;
            margin-bottom: 5rpx;

            &.highlight {
              color: #333;
              font-weight: bold;
            }
          }

          .data-desc {
            font-size: 24rpx;
            color: #999;
          }
        }

        .direction-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;

          .indicator-arrow {
            width: 40rpx;
            height: 40rpx;
            margin-bottom: 8rpx;

            &.increase {
              image {
                width: 100%;
                height: 100%;
                transform: rotate(0deg);
              }
            }

            &.decrease {
              image {
                width: 100%;
                height: 100%;
                transform: rotate(180deg);
              }
            }

            &.neutral {
              image {
                width: 100%;
                height: 100%;
                transform: rotate(0deg);
              }
            }

            image {
              width: 100%;
              height: 100%;
            }
          }

          .change-rate {
            font-size: 24rpx;

            &.increase {
              color: #4CAF50;
            }

            &.decrease {
              color: #F44336;
            }

            &.neutral {
              color: #999;
            }
          }
        }
      }
    }
  }
}
</style>