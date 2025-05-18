<template>
  <view class="diet-record">
    <!-- 顶部安全区域 -->
    <view class="safe-area"></view>

    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">饮食记录</text>
    </view>

    <!-- 使用scroll-view包裹内容区域 -->
    <scroll-view scroll-y class="page-content" :style="{ height: contentHeight + 'px' }">
      <!-- 日期选择器 -->
      <view class="date-selector">
        <view class="date-actions">
          <view class="date-arrow" @click="changeDate(-1)">
            <image src="/static/icons/arrow-left.png"></image>
          </view>
          <picker mode="date" :value="datePickerValue" :end="maxDate" @change="onDateChange">
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

      <!-- 餐次过滤 -->
      <view class="meal-filter">
        <view
          class="filter-item"
          :class="{ active: selectedMealType === '' }"
          @click="filterByMealType('')"
        >
          <text>全部</text>
        </view>
        <view
          class="filter-item"
          v-for="(name, type) in mealTypes"
          :key="type"
          :class="{ active: selectedMealType === type }"
          @click="filterByMealType(type)"
        >
          <text>{{ name }}</text>
        </view>
      </view>

      <!-- 添加饮食按钮（卡片式设计） -->
      <view class="add-food-card" @click="navigateTo('/pages/diet-record/add')">
        <view class="add-food-content">
          <view class="add-food-icon">
            <image src="/static/icons/add-food.png"></image>
          </view>
          <view class="add-food-info">
            <text class="add-food-title">记录今日饮食</text>
            <text class="add-food-desc">点击添加您的饮食记录</text>
          </view>
          <view class="add-food-arrow">
            <image src="/static/icons/arrow-right.png"></image>
          </view>
        </view>
      </view>

      <!-- 饮食列表 -->
      <view class="diet-list">
        <view v-if="loading && !isDataReady" class="loading-state">
          <view class="loading-dots">
            <view class="dot"></view>
            <view class="dot"></view>
            <view class="dot"></view>
          </view>
          <text>加载中...</text>
        </view>
        <view v-else-if="!loading && !isDataReady" class="empty-data-state">
          <image src="/static/icons/empty.png" class="empty-icon"></image>
          <text>暂无数据</text>
        </view>
        <view v-show="isDataReady" class="meal-sections-container">
          <template v-for="(mealType, index) in Object.keys(mealTypes)">
            <transition :key="mealType" name="fade">
              <view
                v-show="selectedMealType === '' || selectedMealType === mealType"
                :key="mealType"
                class="meal-section"
              >
                <view class="meal-header">
                  <text class="meal-type">{{ getMealTypeName(mealType) }}</text>
                  <view class="meal-info">
                    <text class="meal-calorie">{{ getMealTotalCalorie(mealRecords[mealType] || []) }} 千卡</text>
                    <view class="meal-nutrition">
                      <text>蛋白质 {{ getMealTotalNutrition(mealRecords[mealType] || [], 'protein') }}g</text>
                      <text>碳水 {{ getMealTotalNutrition(mealRecords[mealType] || [], 'carbs') }}g</text>
                      <text>脂肪 {{ getMealTotalNutrition(mealRecords[mealType] || [], 'fat') }}g</text>
                    </view>
                  </view>
                  <view class="meal-action" @click="navigateTo(`/pages/diet-record/add?mealType=${mealType}`)">
                    <image src="/static/icons/add-small.png"></image>
                  </view>
                </view>

                <view class="food-list">
                  <view class="empty-tip" v-if="!mealRecords[mealType] || mealRecords[mealType].length === 0">
                    <image src="/static/icons/empty.png" class="empty-food-icon"></image>
                    <text>暂无记录</text>
                  </view>
                  <view
                    class="food-item"
                    v-for="(food, foodIndex) in mealRecords[mealType]"
                    :key="foodIndex"
                  >
                    <view class="food-info">
                      <text class="food-name">{{ food.name }}</text>
                      <text class="food-desc">{{ formatFoodAmount(food) }}</text>
                      <view class="food-nutrition">
                        <text class="nutrition-item">蛋白质: {{ formatNutrition(food.protein) }}g</text>
                        <text class="nutrition-item">碳水: {{ formatNutrition(food.carbs) }}g</text>
                        <text class="nutrition-item">脂肪: {{ formatNutrition(food.fat) }}g</text>
                      </view>
                    </view>
                    <view class="food-calorie">
                      <text>{{ formatNutrition(food.calorie) }} 千卡</text>
                    </view>
                  </view>
                </view>
              </view>
            </transition>
          </template>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { formatDate } from '@/utils/date.js'
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      selectedDate: new Date(),
      datePickerValue: formatDate(new Date(), 'yyyy-MM-dd'), // 日期选择器的值
      maxDate: formatDate(new Date(), 'yyyy-MM-dd'), // 日期选择器的最大可选日期（今天）
      mealTypes: {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snacks: '加餐'
      },
      // 缓存的完整饮食记录数据
      cachedDietRecords: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      },
      lastLoadTime: 0, // 上次加载数据的时间戳
      contentHeight: 0, // 内容区域高度
      loading: false, // 加载状态
      selectedMealType: '' // 选中的餐次
    }
  },
  computed: {
    ...mapState({
      dietRecords: state => state.diet.dietRecords,
      loading: state => state.diet.loading
    }),
    // 数据是否准备好显示
    isDataReady() {
      // 检查 dietRecords 中的各个餐次是否已定义
      if (!this.dietRecords) return false

      // 如果已选择特定餐次，只检查该餐次
      if (this.selectedMealType) {
        return Array.isArray(this.dietRecords[this.selectedMealType])
      }

      // 检查所有餐次是否已定义
      return ['breakfast', 'lunch', 'dinner', 'snacks'].every(
        type => Array.isArray(this.dietRecords[type])
      )
    },
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
    formattedDate() {
      return formatDate(this.selectedDate, 'yyyy年M月d日')
    },
    mealRecords() {
      // 优先使用从store获取的数据，如果没有则使用缓存数据
      const records = this.dietRecords || this.cachedDietRecords || {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      };

      // 确保所有餐次都有值，防止undefined错误
      return {
        breakfast: Array.isArray(records.breakfast) ? records.breakfast : [],
        lunch: Array.isArray(records.lunch) ? records.lunch : [],
        dinner: Array.isArray(records.dinner) ? records.dinner : [],
        snacks: Array.isArray(records.snacks) ? records.snacks : []
      };
    }
  },
  watch: {
    // 监听 dietRecords 变化，更新缓存
    dietRecords: {
      handler(newVal) {
        if (newVal) {
          this.cachedDietRecords = JSON.parse(JSON.stringify(newVal));
        }
      },
      deep: true
    }
  },
  onLoad() {
    this.loadDietRecords()
    this.calcContentHeight()
  },
  onReady() {
    // 页面渲染完成后再次计算内容高度
    this.calcContentHeight()
  },
  onShow() {
    // 每次显示页面时计算内容高度和刷新数据
    this.calcContentHeight()
    this.loadDietRecords()
  },
  // 添加下拉刷新处理方法
  onPullDownRefresh() {
    console.log('饮食记录：下拉刷新')
    // 强制刷新数据
    this.loadDietRecords(true).then(() => {
      // 停止下拉刷新动画
      uni.stopPullDownRefresh()
      // 显示刷新成功提示
      uni.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      })
    })
  },
  methods: {
    ...mapActions({
      fetchDietRecords: 'diet/getDietRecords'
    }),
    navigateTo(url) {
      uni.navigateTo({
        url
      })
    },
    getMealTypeName(type) {
      return this.mealTypes[type] || type
    },
    getMealTotalCalorie(meal) {
      return meal.reduce((total, food) => total + food.calorie, 0)
    },
    getMealTotalNutrition(meal, nutrient) {
      let total = 0
      meal.forEach(food => {
        total += food[nutrient]
      })
      return total
    },
    // 计算内容区域高度
    calcContentHeight() {
      const that = this
      const query = uni.createSelectorQuery().in(this)
      query.select('.header').boundingClientRect()
      query.select('.safe-area').boundingClientRect()
      query.exec(function(res) {
        // 获取屏幕高度
        const windowHeight = uni.getSystemInfoSync().windowHeight
        const headerHeight = res[0] ? res[0].height : 88
        const safeAreaHeight = res[1] ? res[1].height : 80

        // 计算内容区域高度 = 窗口高度 - 顶部安全区域 - 头部高度
        that.contentHeight = windowHeight - safeAreaHeight - headerHeight
      })
    },
    // 日期选择器变化处理
    onDateChange(e) {
      this.datePickerValue = e.detail.value;
      this.selectedDate = new Date(e.detail.value.replace(/-/g, '/'));
      // 强制刷新数据
      this.loadDietRecords(true);
    },
    // 点击切换前后一天
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
      // 强制刷新数据
      this.loadDietRecords(true);
    },
    // 加载饮食记录
    loadDietRecords(forceRefresh = false) {
      // 如果已经在加载中，返回一个已解决的Promise
      if (this.loading) return Promise.resolve();

      // 如果没有强制刷新，并且在短时间内已经加载过（5秒内），则不重新加载
      const now = Date.now();
      if (!forceRefresh && (now - this.lastLoadTime < 5000)) {
        return Promise.resolve();
      }

      // 使用单日模式参数
      const params = {
        date: formatDate(this.selectedDate, 'yyyy-MM-dd'),
        reset: true
      };

      // 返回Promise以便链式调用
      return this.fetchDietRecords(params)
        .then(response => {
          if (response && response.code === 200) {
            // 更新缓存数据
            this.cachedDietRecords = JSON.parse(JSON.stringify(this.dietRecords));
            // 更新加载时间戳
            this.lastLoadTime = now;
          }
          return response;
        })
        .catch(error => {
          uni.showToast({
            title: error?.message || '加载饮食记录失败',
            icon: 'none',
            duration: 2000
          });
          return Promise.reject(error);
        });
    },
    // 过滤饮食记录
    filterByMealType(type) {
      // 如果已经选中该类型，不做任何操作
      if (this.selectedMealType === type) return;

      // 只更新选中状态，不重新加载数据
      this.selectedMealType = type;
    },
    // 格式化营养信息
    formatNutrition(value) {
      return value.toFixed(2)
    },
    // 优化格式化食物量的方法
    formatFoodAmount(food) {
      if (!food) return '';

      // 获取单位和数量
      const unit = food.unit || food.desc || ''; // 尝试获取单位，优先使用unit字段
      const amount = parseFloat(food.amount) || 1; // 确保amount是数字，并处理可能的undefined或0值

      // 返回格式化的结果
      return `${amount}*${unit}`;
    }
  }
}
</script>

<style lang="scss">
.diet-record {
  background-color: #f8f8f8;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 20rpx 20rpx;
}

.safe-area {
  height: 80rpx; /* 增加顶部安全区域高度 */
  background-color: #f8f8f8;
}

.header {
  padding: 0 30rpx;
  height: 88rpx; /* 与胶囊按钮高度一致 */
  display: flex;
  align-items: center;
  background-color: #f8f8f8;

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.page-content {
  flex: 1;
  box-sizing: border-box;
}

.date-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  margin-bottom: 20rpx;
  border-radius: 10rpx;

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

.meal-filter {
  display: flex;
  overflow-x: auto;
  padding: 15rpx 0;
  margin-bottom: 20rpx;
  white-space: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }

  .filter-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 68rpx;
    padding: 0 30rpx;
    background-color: #F5F5F5;
    border-radius: 34rpx;
    margin-right: 15rpx;
    transition: all 0.3s ease;

    text {
      font-size: 26rpx;
      color: #666666;
      transition: all 0.3s ease;
    }

    &.active {
      background-color: #4CAF50;
      box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.3);

      text {
        color: #FFFFFF;
        font-weight: bold;
      }
    }

    &:active {
      transform: scale(0.96);
      opacity: 0.9;
    }
  }
}

.add-food-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  margin: 20rpx 0;
  padding: 6rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.1);
  }

  .add-food-content {
    display: flex;
    align-items: center;
    padding: 20rpx;

    .add-food-icon {
      width: 80rpx;
      height: 80rpx;
      margin-right: 20rpx;

      image {
        width: 100%;
        height: 100%;
      }
    }

    .add-food-info {
      flex: 1;

      .add-food-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333333;
        margin-bottom: 8rpx;
      }

      .add-food-desc {
		margin-left: 10rpx;
        font-size: 24rpx;
        color: #999999;
      }
    }

    .add-food-arrow {
      width: 40rpx;
      height: 40rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      image {
        width: 24rpx;
        height: 24rpx;
      }
    }
  }
}

.diet-list {
  margin-bottom: 20rpx;

  .loading-state {
    text-align: center;
    padding: 40rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 200rpx;

    .loading-dots {
      display: flex;
      justify-content: center;
      margin-bottom: 15rpx;

      .dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        background-color: #4CAF50;
        margin: 0 8rpx;
        opacity: 0.6;
        animation: dot-bounce 1.4s infinite ease-in-out both;

        &:nth-child(1) {
          animation-delay: 0s;
        }

        &:nth-child(2) {
          animation-delay: 0.2s;
        }

        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }

    text {
      font-size: 28rpx;
      color: #999;
    }
  }

  .empty-data-state {
    text-align: center;
    padding: 60rpx 0;
    color: #999;
    font-size: 28rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    border-radius: 12rpx;
    margin: 20rpx 0;
    min-height: 300rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);

    .empty-icon {
      width: 120rpx;
      height: 120rpx;
      margin-bottom: 20rpx;
      opacity: 0.7;
    }

    text {
      font-size: 28rpx;
      color: #999;
    }
  }

  .meal-sections-container {
    width: 100%;

    .meal-section {
      background-color: #ffffff;
      margin-bottom: 30rpx;
      border-radius: 16rpx;
      overflow: hidden;
      padding: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);

      .meal-header {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;
        padding: 0 10rpx;

        .meal-type {
          font-size: 32rpx;
          font-weight: bold;
          color: #333333;
          margin-right: 20rpx;
          padding: 6rpx 0;
        }

        .meal-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .meal-calorie {
            font-size: 28rpx;
            color: #4CAF50;
            font-weight: bold;
            margin-bottom: 4rpx;
          }

          .meal-nutrition {
            display: flex;
            flex-wrap: wrap;

            text {
              font-size: 22rpx;
              color: #999999;
              margin-right: 16rpx;
            }
          }
        }

        .meal-action {
          width: 60rpx;
          height: 60rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 30rpx;
          background-color: #4CAF50;
          margin-left: 10rpx;
          box-shadow: 0 2rpx 6rpx rgba(76, 175, 80, 0.3);

          image {
            width: 32rpx;
            height: 32rpx;
            filter: brightness(0) invert(1); /* 使图标变为白色 */
          }

          &:active {
            background-color: #388E3C;
            transform: scale(0.95);
          }
        }
      }

      .food-list {
        .empty-tip {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 160rpx;
          background-color: #f9f9f9;
          border-radius: 12rpx;
          margin: 10rpx;
          box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;

          .empty-food-icon {
            width: 64rpx;
            height: 64rpx;
            margin-bottom: 12rpx;
            opacity: 0.6;
          }

          text {
            font-size: 26rpx;
            color: #999999;
          }
        }

        .food-item {
          display: flex;
          align-items: center;
          padding: 20rpx;
          background-color: #FFFFFF;
          border-radius: 12rpx;
          margin: 10rpx;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;

          &:active {
            transform: scale(0.99);
            box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.08);
          }

          .food-info {
            flex: 1;

            .food-name {
              font-size: 28rpx;
              font-weight: bold;
              color: #333333;
              margin-bottom: 8rpx;
            }

            .food-desc {
              font-size: 24rpx;
              color: #666666;
              margin-bottom: 10rpx;
            }

            .food-nutrition {
              display: flex;
              flex-wrap: wrap;

              .nutrition-item {
                font-size: 22rpx;
                color: #999999;
                margin-right: 16rpx;
                padding: 4rpx 12rpx;
                background-color: #F5F5F5;
                border-radius: 12rpx;
                margin-bottom: 4rpx;
              }
            }
          }

          .food-calorie {
            font-size: 28rpx;
            font-weight: bold;
            color: #4CAF50;
            padding-left: 20rpx;
          }
        }
      }
    }
  }
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 添加淡入淡出过渡效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>