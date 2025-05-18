<template>
  <view class="nutrition-analysis">
    <!-- 顶部安全区域 -->
    <view class="safe-area"></view>

    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">营养分析</text>
    </view>

    <!-- 内联式日期选择器（替换原有的弹出式日历） -->
    <view class="date-selector">
      <view class="date-actions">
        <view class="date-arrow" @click="changeDate(-1)">
          <image src="/static/icons/arrow-left.png"></image>
        </view>
        <picker mode="date" :value="datePickerValue" :end="endDate" @change="onDateChange">
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
      <!-- 核心营养素 -->
      <view class="core-nutrients card">
        <view class="section-header">
          <text class="section-title">核心营养素</text>
          <text class="date-info">{{ formattedDate }}</text>
        </view>

        <view class="nutrients-grid">
          <view class="nutrient-card" v-for="(item, index) in mainNutritionItems" :key="index">
            <view class="nutrient-header">
              <text class="nutrient-label">{{ item.label }}</text>
              <text class="nutrient-value">{{ item.value }}</text>
            </view>
            <view class="progress-container">
              <view class="progress-bar">
                <view class="progress" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></view>
              </view>
              <text class="percentage-text">{{ formatPercentage(item.percentage) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 卡路里周趋势 -->
      <view class="trend-chart card">
        <view class="section-header">
          <text class="section-title">卡路里周趋势</text>
          <view class="legend">
            <view class="legend-item">
              <view class="legend-color" :style="{ backgroundColor: calorieColor }"></view>
              <text class="legend-label">热量</text>
            </view>
          </view>
        </view>

        <view class="chart-container">
          <qiun-data-charts
            v-if="showCalorieChart"
            type="line"
            :opts="calorieChartOpts"
            :chartData="calorieChartData"
            canvasId="calorieChart"
            ref="calorieChart"
          />
        </view>
      </view>

      <!-- 营养素周趋势 -->
      <view class="trend-chart card">
        <view class="section-header">
          <text class="section-title">营养素周趋势</text>
          <view class="legend">
            <view class="legend-item" v-for="(item, index) in nutrientLegendItems" :key="index">
              <view class="legend-color" :style="{ backgroundColor: item.color }"></view>
              <text class="legend-label">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="chart-container">
          <qiun-data-charts
            v-if="showNutrientChart"
            type="line"
            :opts="nutrientChartOpts"
            :chartData="nutrientChartData"
            canvasId="nutrientChart"
            ref="nutrientChart"
          />
        </view>
      </view>

      <!-- 营养建议 -->
      <view class="nutrition-advice card">
        <view class="section-header">
          <text class="section-title">营养建议</text>
        </view>

        <view class="advice-content">
          <view class="advice-item" v-for="(item, index) in nutritionAdvice" :key="index">
            <view class="advice-icon" :class="item.type || 'info'">
              <image :src="getAdviceIcon(item.type || 'info')"></image>
            </view>
            <view class="advice-text">
              <text class="advice-title">{{ item.title }}</text>
              <text class="advice-desc">{{ item.description }}</text>
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
      datePickerValue: formatDate(new Date(), 'yyyy-MM-dd'), // 添加日期选择器变量
      startDate: this.getDateMonthsAgo(3), // 三个月前
      endDate: new Date().toISOString().split('T')[0], // 今天
      formattedDate: '',
      calorieColor: '#FF9800',
      nutrientLegendItems: [
        { label: '蛋白质', color: '#4CAF50' },
        { label: '碳水', color: '#2196F3' },
        { label: '脂肪', color: '#E91E63' }
      ],
      // 数据缓存时间戳，用于判断是否需要重新获取数据
      lastDataFetchTime: 0,
      // 缓存刷新间隔，单位为毫秒（默认5分钟）
      dataCacheTime: 5 * 60 * 1000,
      // 控制图表显示的变量
      showCalorieChart: true,
      showNutrientChart: true,

      // 添加图表配置选项
      calorieChartOpts: {
        color: ['#FF9800'],
        padding: [30, 40, 20, 40],
        enableScroll: false,
        dataLabel: false,
        legend: {
          show: true
        },
        xAxis: {
          disableGrid: true
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 2,
          data: []
        },
        extra: {
          line: {
            type: 'curve',
            width: 2
          }
        }
      },
      nutrientChartOpts: {
        color: ['#4CAF50', '#2196F3', '#E91E63'],
        padding: [30, 40, 20, 40],
        enableScroll: false,
        dataLabel: false,
        legend: {
          show: true
        },
        xAxis: {
          disableGrid: true
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 2,
          data: []
        },
        extra: {
          line: {
            type: 'curve',
            width: 2
          }
        }
      },
      // 图表数据
      calorieChartData: {
        categories: [],
        series: []
      },
      nutrientChartData: {
        categories: [],
        series: []
      }
    }
  },
  computed: {
    ...mapGetters({
      nutritionData: 'nutrition/nutritionData',
      nutritionTrend: 'nutrition/nutritionTrend',
      nutritionAdvice: 'nutrition/nutritionAdvice',
      isLoading: 'nutrition/isLoading',
      dataChanged: 'nutrition/dataChanged' // 添加数据变更标志
    }),

    // 格式化主要营养素数据
    mainNutritionItems() {
      return [
        {
          label: '热量',
          value: this.nutritionData.calorie + 'kcal',
          percentage: this.nutritionData.caloriePercentage || 0,
          color: '#FF9800'
        },
        {
          label: '蛋白质',
          value: this.nutritionData.protein + 'g',
          percentage: this.nutritionData.proteinPercentage || 0,
          color: '#4CAF50'
        },
        {
          label: '碳水',
          value: this.nutritionData.carbs + 'g',
          percentage: this.nutritionData.carbsPercentage || 0,
          color: '#2196F3'
        },
        {
          label: '脂肪',
          value: this.nutritionData.fat + 'g',
          percentage: this.nutritionData.fatPercentage || 0,
          color: '#E91E63'
        }
      ]
    },

    // 日期标题计算属性
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

    // 格式化日期显示
    formattedDate() {
      return formatDate(this.selectedDate, 'yyyy年MM月dd日')
    }
  },
  watch: {
    // 监听营养趋势数据，更新图表
    nutritionTrend: {
      handler(newValue) {
        if (newValue && newValue.dateList && newValue.dateList.length > 0) {
          this.updateChartData()
        }
      },
      deep: true
    },
    // 监听图表显示变量，在图表隐藏后短暂延迟重新显示
    showCalorieChart(val) {
      if (val === false) {
        // 在下一个宏任务中重新显示图表，触发组件重新创建
        setTimeout(() => {
          this.showCalorieChart = true
        }, 50)
      }
    },
    showNutrientChart(val) {
      if (val === false) {
        // 在下一个宏任务中重新显示图表，触发组件重新创建
        setTimeout(() => {
          this.showNutrientChart = true
        }, 50)
      }
    }
  },
  onLoad() {
    // 初始化日期选择器的值
    this.datePickerValue = formatDate(this.selectedDate, 'yyyy-MM-dd')
    this.formattedDate = formatDate(this.selectedDate, 'yyyy年MM月dd日')
    this.fetchAllNutritionData()
  },
  onReady() {
    // 不再需要手动初始化图表
    // setTimeout(() => {
    //   this.initCharts()
    // }, 300)

    // 不再需要监听日历状态
  },
  onPullDownRefresh() {
    // 下拉刷新时，强制获取新数据，忽略缓存
    console.log('营养分析：下拉刷新，强制获取新数据')
    this.fetchAllNutritionData().then(() => {
      uni.stopPullDownRefresh()
    })
  },
  onUnload() {
    // 不再需要清除定时器
  },
  onShow() {
    const currentTime = Date.now()
    const timeSinceLastFetch = currentTime - this.lastDataFetchTime

    // 检查是否需要刷新数据：首次加载、缓存过期或数据已变更
    if (this.lastDataFetchTime === 0 || timeSinceLastFetch > this.dataCacheTime || this.dataChanged) {
      // 如果是首次加载、缓存已过期或数据已变更，则重新获取数据
      console.log('营养分析：刷新数据', this.dataChanged ? '（数据已变更）' : '（缓存过期）')
      this.fetchAllNutritionData()
        .then(() => {
          // 更新数据缓存时间戳
          this.lastDataFetchTime = Date.now()

          // 重置数据变更标志
          if (this.dataChanged) {
            this.$store.dispatch('nutrition/setDataChanged', false)
          }
        })
    } else {
      // 缓存有效，只刷新图表渲染
      console.log('营养分析：使用缓存数据，仅刷新图表')
      this.refreshCharts()
    }
  },
  methods: {
    ...mapActions({
      fetchNutritionData: 'nutrition/fetchNutritionData',
      fetchNutritionTrend: 'nutrition/fetchNutritionTrend',
      fetchNutritionAdvice: 'nutrition/fetchNutritionAdvice'
    }),

    // 格式化百分比，保留整数
    formatPercentage(value) {
      if (!value && value !== 0) return '0%'
      return Math.round(value) + '%'
    },

    // 格式化趋势图X轴日期显示，只保留日
    formatChartDate(dateStr) {
      if (!dateStr) return '';
      // 将日期如 2025-04-17 格式化为 17
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        return parts[2];
      }
      return dateStr;
    },

    // 获取所有营养相关数据
    async fetchAllNutritionData() {
      try {
        const dateStr = formatDate(this.selectedDate, 'yyyy-MM-dd')
        await Promise.all([
          this.fetchNutritionData({ date: dateStr }),
          this.fetchNutritionTrend({ type: 'week' }),
          this.fetchNutritionAdvice({ date: dateStr })
        ])

        // 更新数据缓存时间戳
        this.lastDataFetchTime = Date.now()

        // 更新图表数据
        this.updateChartData()

        return Promise.resolve()
      } catch (error) {
        console.error('获取营养数据失败', error)
        uni.showToast({
          title: '获取数据失败，请稍后重试',
          icon: 'none'
        })
        return Promise.reject(error)
      }
    },

    // 更新图表数据
    updateChartData() {
      if (!this.nutritionTrend || !this.nutritionTrend.dateList || this.nutritionTrend.dateList.length === 0) {
        return
      }

      // 更新卡路里图表数据
      this.calorieChartData = {
        categories: this.nutritionTrend.dateList.map(this.formatChartDate),
        series: [
          {
            name: '热量',
            data: this.nutritionTrend.calorieList
          }
        ]
      }

      // 更新营养素图表数据
      this.nutrientChartData = {
        categories: this.nutritionTrend.dateList.map(this.formatChartDate),
        series: [
          {
            name: '蛋白质',
            data: this.nutritionTrend.proteinList
          },
          {
            name: '碳水',
            data: this.nutritionTrend.carbsList
          },
          {
            name: '脂肪',
            data: this.nutritionTrend.fatList
          }
        ]
      }

      // 延迟一下确保DOM更新后再触发图表重绘
      this.$nextTick(() => {
        // 手动触发图表组件刷新
        if (this.$refs.calorieChart) {
          // 通过改变reload属性强制图表重新渲染
          this.$refs.calorieChart.reload = true
        }
        if (this.$refs.nutrientChart) {
          this.$refs.nutrientChart.reload = true
        }
      })
    },

    // 切换日期
    changeDate(days) {
      const newDate = new Date(this.selectedDate);
      newDate.setDate(newDate.getDate() + days);

      // 检查是否超过今天
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 规范化newDate，清除时间部分，只保留日期部分
      newDate.setHours(0, 0, 0, 0);

      if (newDate > today && days > 0) {
        // 如果是向后选择且超过今天，则不执行并提示用户
        uni.showToast({
          title: '不能选择今天之后的日期',
          icon: 'none',
          duration: 2000
        });
        return;
      }

      this.selectedDate = newDate;
      this.datePickerValue = formatDate(newDate, 'yyyy-MM-dd');
      // 刷新数据
      this.fetchAllNutritionData();
    },

    // 日期选择器变化处理
    onDateChange(e) {
      this.datePickerValue = e.detail.value;
      this.selectedDate = new Date(e.detail.value.replace(/-/g, '/'));
      // 刷新数据
      this.fetchAllNutritionData();
    },

    // 获取建议图标
    getAdviceIcon(type) {
      const icons = {
        warning: '/static/icons/warning.png',
        info: '/static/icons/info.png',
        danger: '/static/icons/danger.png',
        success: '/static/icons/success.png'
      }
      return icons[type] || icons.info
    },

    // 获取几个月前的日期
    getDateMonthsAgo(months) {
      const date = new Date()
      date.setMonth(date.getMonth() - months)
      return date.toISOString().split('T')[0]
    },

    // 仅刷新图表渲染，不获取新数据
    refreshCharts() {
      // 先更新一次图表数据，确保数据是最新的格式
      this.updateChartData()

      // 通过临时隐藏图表组件然后重新显示，强制重新渲染
      this.showCalorieChart = false
      this.showNutrientChart = false

      // 这会触发watch，图表会在短暂延迟后重新显示
    }
  }
}
</script>

<style lang="scss">
.nutrition-analysis {
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
  justify-content: space-between;
  align-items: center;
  position: relative;
  margin-bottom: 20rpx;

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

// 日期选择器样式
.date-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  margin-bottom: 20rpx;
  border-radius: 10rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  z-index: 10; // 确保日期选择器在图表上方

  .date-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0;

    .date-arrow {
      width: 40rpx;
      height: 40rpx;
      display: flex;
      justify-content: center;
      align-items: center;

      image {
        width: 24rpx;
        height: 24rpx;
      }
    }

    .date-display {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10rpx 0;
      max-width: 300rpx;

      .date-title {
        font-size: 40rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 10rpx;
      }

      .date-value {
        font-size: 28rpx;
        color: #999;
      }
    }
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

.card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-in-out;
  position: relative; // 添加相对定位以确保z-index正常工作
  z-index: 1; // 确保卡片在日期选择器下方
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

  .legend {
    display: flex;

    .legend-item {
      display: flex;
      align-items: center;
      margin-left: 20rpx;

      .legend-color {
        width: 20rpx;
        height: 20rpx;
        border-radius: 4rpx;
        margin-right: 8rpx;
      }

      .legend-label {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}

.nutrients-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;

  .nutrient-card {
    background-color: #f9f9f9;
    border-radius: 16rpx;
    padding: 20rpx;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
    }

    .nutrient-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16rpx;

      .nutrient-label {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }

      .nutrient-value {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
      }
    }

    .progress-container {
      display: flex;
      align-items: center;

      .progress-bar {
        flex: 1;
        height: 20rpx;
        background-color: #f0f0f0;
        border-radius: 10rpx;
        overflow: hidden;
        margin-right: 16rpx;

        .progress {
          height: 100%;
          border-radius: 10rpx;
          transition: width 0.8s ease;
        }
      }

      .percentage-text {
        font-size: 24rpx;
        color: #666;
        width: 60rpx;
        text-align: right;
      }
    }
  }
}

.chart-container {
  height: 380rpx;
  padding-bottom: 20rpx;
}

// 为秋云图表组件添加样式
.qiun-charts {
  width: 100%;
  height: 350rpx;
  z-index: 1; // 确保图表在日期选择器下方
}

// 确保图表容器有足够的高度
.trend-chart {
  min-height: 450rpx;
}

.advice-content {
  .advice-item {
    display: flex;
    margin-bottom: 30rpx;

    .advice-icon {
      width: 60rpx;
      height: 60rpx;
      border-radius: 30rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 20rpx;

      &.info {
        background-color: #E3F2FD;
      }

      &.warning {
        background-color: #FFF3E0;
      }

      &.danger {
        background-color: #FFEBEE;
      }

      &.success {
        background-color: #E8F5E9;
      }

      image {
        width: 36rpx;
        height: 36rpx;
      }
    }

    .advice-text {
      flex: 1;

      .advice-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
        display: block;
      }

      .advice-desc {
        font-size: 26rpx;
        color: #666;
        line-height: 1.5;
      }
    }
  }
}
</style>