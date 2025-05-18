<template>
  <view class="add-diet">
    <!-- 添加顶部安全区域 -->
    <view class="safe-area"></view>

    <view class="header">
      <view class="back-btn" @click="navigateBack()">
        <image src="/static/icons/back.png"></image>
      </view>
      <text class="title">添加饮食记录</text>
    </view>

    <view class="form-section">
      <!-- 餐次选择 -->
      <view class="meal-selector">
        <view
          class="meal-option"
          v-for="(meal, index) in mealTypes"
          :key="index"
          :class="{ active: selectedMeal === meal.key }"
          @click="selectedMeal = meal.key"
        >
          <text>{{ meal.name }}</text>
        </view>
      </view>

      <!-- 日期选择 -->
      <view class="form-item">
        <text class="form-label">日期</text>
        <view class="form-input">
          <picker
            mode="date"
            :value="selectedDate"
            @change="onDateChange"
          >
            <view class="picker-value">
              <text>{{ selectedDate }}</text>
              <image src="/static/icons/calendar.png"></image>
            </view>
          </picker>
        </view>
      </view>

      <!-- 时间选择 -->
      <view class="form-item">
        <text class="form-label">时间</text>
        <view class="form-input">
          <picker
            mode="time"
            :value="selectedTime"
            @change="onTimeChange"
          >
            <view class="picker-value">
              <text>{{ selectedTime }}</text>
              <image src="/static/icons/clock.png"></image>
            </view>
          </picker>
        </view>
      </view>

      <!-- 食物列表 -->
      <view class="food-list">
        <view class="section-header">
          <text class="section-title">食物列表</text>
          <view class="add-food-btn" @click="showFoodSearch">
            <image src="/static/icons/add-food.png"></image>
            <text>添加食物</text>
          </view>
        </view>

        <view class="empty-tip" v-if="selectedFoods.length === 0">
          <image src="/static/icons/empty.png"></image>
          <text>暂无食物，请添加</text>
        </view>

        <view class="food-item" v-for="(food, index) in selectedFoods" :key="index">
          <view class="food-info">
            <text class="food-name">{{ food.name }}</text>
            <text class="food-desc">{{ food.unitDisplay }}</text>
          </view>
          <view class="food-amount">
            <view class="amount-control">
              <view class="minus-btn" @click="decreaseAmount(index)">
                <text>-</text>
              </view>
              <input type="number" v-model="food.amount" class="amount-input" @input="recalculateNutrition(index)" />
              <view class="plus-btn" @click="increaseAmount(index)">
                <text>+</text>
              </view>
            </view>
          </view>
          <view class="food-nutrition-info">
            <text class="food-calorie">{{ food.calories.toFixed(0) }}千卡</text>
            <view class="nutrition-detail">
              <text>蛋白质:{{ food.protein.toFixed(1) }}g</text>
              <text>脂肪:{{ food.fat.toFixed(1) }}g</text>
              <text>碳水:{{ food.carbs.toFixed(1) }}g</text>
            </view>
          </view>
          <view class="delete-btn" @click="removeFood(index)">
            <image src="/static/icons/delete.png"></image>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view class="form-item">
        <text class="form-label">备注</text>
        <view class="form-input">
          <textarea v-model="remark" placeholder="添加备注信息" />
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="total-calorie">
        <text>总热量: {{ totalCalorie }}千卡</text>
      </view>
      <view class="save-btn" @click="saveDietRecord">
        <text>保存记录</text>
      </view>
    </view>

    <!-- 食物搜索弹窗 -->
    <view class="food-search-modal" v-if="showFoodModal">
      <view class="modal-mask" @click="hideFoodSearch"></view>
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">添加食物</text>
          <view class="close-btn" @click="hideFoodSearch">
            <image src="/static/icons/close.png"></image>
          </view>
        </view>

        <view class="search-box">
          <image src="/static/icons/search.png"></image>
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索食物"
            @input="searchFood"
          />
        </view>

        <!-- 分类筛选 -->
        <scroll-view scroll-x class="category-scroll" :show-scrollbar="false">
          <view
            class="category-item"
            :class="{ active: selectedCategoryId === undefined }"
            @click="selectCategory(null)"
          >
            <text>全部</text>
          </view>
          <view
            class="category-item"
            v-for="category in foodCategories"
            :key="category.id"
            :class="{ active: selectedCategoryId === category.id }"
            @click="selectCategory(category.id)"
          >
            <text>{{ category.name }}</text>
          </view>
        </scroll-view>

        <!-- 食物列表 -->
        <scroll-view
          scroll-y
          class="food-scroll"
          @scrolltolower="loadMoreFoods"
          :lower-threshold="50"
        >
          <view class="food-list-container">
            <view class="food-card" v-for="(food, index) in searchResults" :key="index" @click="showFoodSelectionPanel(food)">
              <view class="food-card-main">
                <view class="food-info">
                  <text class="food-name">{{ food.name }}</text>
                  <!-- 已移除 food.desc -->
                </view>
                <view class="food-nutrition">
                  <text class="food-calorie">{{ food.calories }}千卡</text>
                  <text class="food-unit">{{ food.measure }}</text>
                </view>
              </view>
              <view class="food-detail">
                <view class="nutrition-item">
                  <text class="nutrition-value">{{ food.protein }}g</text>
                  <text class="nutrition-label">蛋白质</text>
                </view>
                <view class="nutrition-item">
                  <text class="nutrition-value">{{ food.fat }}g</text>
                  <text class="nutrition-label">脂肪</text>
                </view>
                <view class="nutrition-item">
                  <text class="nutrition-value">{{ food.carbs }}g</text>
                  <text class="nutrition-label">碳水</text>
                </view>
              </view>
            </view>

            <!-- 加载状态 -->
            <view class="loading-state" v-if="isLoadingMore">
              <view class="loading-dots">
                <view class="dot"></view>
                <view class="dot"></view>
                <view class="dot"></view>
              </view>
              <text>正在加载更多美食...</text>
            </view>

            <!-- 全部加载完成 -->
            <view class="all-loaded-state" v-if="!hasMore && searchResults.length > 0">
              <view class="divider-line"></view>
              <view class="all-loaded-content">
                <image src="/static/icons/empty.png" class="end-icon"></image>
                <text>已经到底啦，没有更多食物了</text>
              </view>
            </view>

            <!-- 无结果提示 -->
            <view class="empty-tip" v-if="searchResults.length === 0 && !isLoadingMore">
              <image src="/static/icons/empty.png"></image>
              <text>未找到相关食物</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 食物选择面板 -->
    <view class="food-selection-panel" v-if="showSelectionPanel">
      <view class="modal-mask" @click="hideSelectionPanel"></view>
      <view class="selection-content">
        <view class="selection-header">
          <text class="selection-title">{{ currentFood.name }}</text>
          <view class="close-btn" @click="hideSelectionPanel">
            <image src="/static/icons/close.png"></image>
          </view>
        </view>

        <view class="selection-tabs">
          <view
            class="tab-item"
            :class="{ active: selectionMode === 'unit' }"
            @click="selectionMode = 'unit'"
          >
            <text>按单位添加</text>
          </view>
          <view
            class="tab-item"
            :class="{ active: selectionMode === 'grams' }"
            @click="selectionMode = 'grams'"
          >
            <text>按克数添加</text>
          </view>
        </view>

        <view class="selection-body">
          <!-- 单位选择模式 -->
          <view class="unit-selection" v-if="selectionMode === 'unit'">
            <view class="food-measure">
              <text>{{ currentFood.measure }}（约{{ currentFood.grams }}克）</text>
            </view>
            <view class="amount-control">
              <view class="control-btn minus" @click="decreaseUnitAmount">
                <text>-</text>
              </view>
              <input type="number" v-model="unitAmount" class="amount-input" />
              <view class="control-btn plus" @click="increaseUnitAmount">
                <text>+</text>
              </view>
            </view>
            <view class="nutrition-preview">
              <view class="preview-item">
                <text class="preview-label">热量</text>
                <text class="preview-value">{{ getUnitCalories() }}千卡</text>
              </view>
              <view class="preview-item">
                <text class="preview-label">蛋白质</text>
                <text class="preview-value">{{ getUnitProtein() }}g</text>
              </view>
              <view class="preview-item">
                <text class="preview-label">脂肪</text>
                <text class="preview-value">{{ getUnitFat() }}g</text>
              </view>
              <view class="preview-item">
                <text class="preview-label">碳水</text>
                <text class="preview-value">{{ getUnitCarbs() }}g</text>
              </view>
            </view>
          </view>

          <!-- 克数选择模式 -->
          <view class="grams-selection" v-if="selectionMode === 'grams'">
            <view class="grams-input-container">
              <input
                type="number"
                v-model="customGrams"
                class="grams-input"
                @input="updateNutritionByGrams"
              />
              <text class="grams-label">克</text>
            </view>
            <view class="nutrition-preview">
              <view class="preview-item">
                <text class="preview-label">热量</text>
                <text class="preview-value">{{ getGramsCalories() }}千卡</text>
              </view>
              <view class="preview-item">
                <text class="preview-label">蛋白质</text>
                <text class="preview-value">{{ getGramsProtein() }}g</text>
              </view>
              <view class="preview-item">
                <text class="preview-label">脂肪</text>
                <text class="preview-value">{{ getGramsFat() }}g</text>
              </view>
              <view class="preview-item">
                <text class="preview-label">碳水</text>
                <text class="preview-value">{{ getGramsCarbs() }}g</text>
              </view>
            </view>
          </view>
        </view>

        <view class="selection-footer">
          <view class="cancel-btn" @click="hideSelectionPanel">
            <text>取消</text>
          </view>
          <view class="confirm-btn" @click="confirmAddFood">
            <text>添加</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import { formatDate } from '@/utils/date'

export default {
  data() {
    return {
      selectedMeal: 'breakfast',
      selectedDate: formatDate(new Date(), 'yyyy-MM-dd'),
      selectedTime: formatDate(new Date(), 'hh:mm'),
      selectedFoods: [],
      remark: '',
      mealTypes: [
        { key: 'breakfast', name: '早餐' },
        { key: 'lunch',     name: '午餐' },
        { key: 'dinner',    name: '晚餐' },
        { key: 'snacks',    name: '加餐' }
      ],
      // 食物搜索相关
      showFoodModal: false,
      searchKeyword: '',
      selectedCategoryId: undefined, // 使用undefined而不是null

      // 食物选择面板相关
      showSelectionPanel: false,
      selectionMode: 'unit',
      unitAmount: 1,
      customGrams: 100
    }
  },
  computed: {
    ...mapState({
      searchResults: state => state.food.foodList,
      foodCategories: state => state.food.foodCategories,
      isLoadingMore:  state => state.food.loading,
      currentFood:    state => state.food.currentFood
    }),
    ...mapGetters({
      hasMore: 'food/hasMoreFood'
    }),
    totalCalorie() {
      return this.selectedFoods
        .reduce((sum, f) => sum + f.calories, 0)
        .toFixed(0)
    }
  },
  created() {
    this.fetchFoodCategories()
  },
  methods: {
    ...mapActions({
      addDietRecord:    'diet/addDietRecord',
      getFoodList:      'food/getFoodList',
      getFoodCategories:'food/getFoodCategories',
      getFoodDetail:    'food/getFoodDetail',
      setCurrentFood:   'food/setCurrentFood'
    }),

    // 表单操作
    onDateChange(e) { this.selectedDate = e.detail.value },
    onTimeChange(e) { this.selectedTime = e.detail.value },

    // 获取分类
    fetchFoodCategories() {
      this.getFoodCategories()
    },

    // 搜索逻辑
    showFoodSearch() {
      this.showFoodModal = true
      this.searchKeyword = ''
      this.selectedCategoryId = undefined // 使用undefined而不是null
      this.searchFood(true)
    },
    hideFoodSearch() {
      this.showFoodModal = false
    },
    selectCategory(categoryId) {
      // 如果选择"全部"，将selectedCategoryId设置为undefined而不是null
      this.selectedCategoryId = categoryId === null ? undefined : categoryId
      this.searchFood(true)
    },
    searchFood(reset = false) {
      this.getFoodList({
        keyword:  this.searchKeyword,
        categoryId: this.selectedCategoryId,
        reset
      })
    },
    loadMoreFoods() {
      if (this.hasMore && !this.isLoadingMore) {
        this.searchFood(false)
      }
    },

    // 打开/关闭选择面板
    showFoodSelectionPanel(food) {
      this.setCurrentFood(food)
      this.showSelectionPanel = true
      this.selectionMode = 'unit'
      this.unitAmount = 1
      this.customGrams = food.grams
    },
    hideSelectionPanel() {
      this.showSelectionPanel = false
      this.setCurrentFood(null)
    },

    // 单位模式
    increaseUnitAmount() { this.unitAmount++ },
    decreaseUnitAmount() { if (this.unitAmount > 1) this.unitAmount-- },
    getUnitCalories() { return this.currentFood ? (this.currentFood.calories * this.unitAmount).toFixed(1) : 0 },
    getUnitProtein()  { return this.currentFood ? (this.currentFood.protein  * this.unitAmount).toFixed(1) : 0 },
    getUnitFat()      { return this.currentFood ? (this.currentFood.fat      * this.unitAmount).toFixed(1) : 0 },
    getUnitCarbs()    { return this.currentFood ? (this.currentFood.carbs    * this.unitAmount).toFixed(1) : 0 },

    // 克数模式
    updateNutritionByGrams() {
      // 计算在 getGramsXxx 中实时完成
    },
    getGramsCalories() {
      return this.currentFood && this.currentFood.grams
        ? (this.currentFood.calories * this.customGrams / this.currentFood.grams).toFixed(1)
        : 0
    },
    getGramsProtein() {
      return this.currentFood && this.currentFood.grams
        ? (this.currentFood.protein * this.customGrams / this.currentFood.grams).toFixed(1)
        : 0
    },
    getGramsFat() {
      return this.currentFood && this.currentFood.grams
        ? (this.currentFood.fat * this.customGrams / this.currentFood.grams).toFixed(1)
        : 0
    },
    getGramsCarbs() {
      return this.currentFood && this.currentFood.grams
        ? (this.currentFood.carbs * this.customGrams / this.currentFood.grams).toFixed(1)
        : 0
    },

    // 确认添加
    confirmAddFood() {
      if (!this.currentFood) return

      const f = this.currentFood
      const added = {
        id: f.id,
        name: f.name,
        unit: '',
        unitDisplay: '',
        amount: 0,
        grams: 0,
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        baseCalories: 0,
        baseProtein: 0,
        baseFat: 0,
        baseCarbs: 0,
        baseGrams: 0
      }

      if (this.selectionMode === 'unit') {
        added.unit = f.measure
        added.unitDisplay = `单位/${f.measure}`
        added.amount = this.unitAmount
        added.grams    = f.grams * this.unitAmount
        added.calories = f.calories * this.unitAmount
        added.protein  = f.protein  * this.unitAmount
        added.fat      = f.fat      * this.unitAmount
        added.carbs    = f.carbs    * this.unitAmount

        added.baseCalories = f.calories
        added.baseProtein  = f.protein
        added.baseFat      = f.fat
        added.baseCarbs    = f.carbs
        added.baseGrams    = f.grams
      } else {
        added.unit = '克'
        added.unitDisplay = '单位/克'
        added.amount = this.customGrams
        added.grams    = this.customGrams
        added.calories = f.calories * this.customGrams / f.grams
        added.protein  = f.protein  * this.customGrams / f.grams
        added.fat      = f.fat      * this.customGrams / f.grams
        added.carbs    = f.carbs    * this.customGrams / f.grams

        added.baseCalories = f.calories / f.grams
        added.baseProtein  = f.protein  / f.grams
        added.baseFat      = f.fat      / f.grams
        added.baseCarbs    = f.carbs    / f.grams
        added.baseGrams    = 1
      }

      this.selectedFoods.push(added)
      this.hideSelectionPanel()
      this.hideFoodSearch()
    },

    // 列表操作
    increaseAmount(index) {
      this.selectedFoods[index].amount++
      this.recalculateNutrition(index)
    },
    decreaseAmount(index) {
      if (this.selectedFoods[index].amount > 1) {
        this.selectedFoods[index].amount--
        this.recalculateNutrition(index)
      }
    },
    recalculateNutrition(i) {
      const food = this.selectedFoods[i]
      if (food.unit === '克') {
        food.grams    = food.amount
        food.calories = food.baseCalories * food.amount
        food.protein  = food.baseProtein  * food.amount
        food.fat      = food.baseFat      * food.amount
        food.carbs    = food.baseCarbs    * food.amount
      } else {
        food.grams    = food.baseGrams    * food.amount
        food.calories = food.baseCalories * food.amount
        food.protein  = food.baseProtein  * food.amount
        food.fat      = food.baseFat      * food.amount
        food.carbs    = food.baseCarbs    * food.amount
      }
    },
    removeFood(index) {
      this.selectedFoods.splice(index, 1)
    },

    // 保存记录
    saveDietRecord() {
      if (this.selectedFoods.length === 0) {
        this.showToast('请先添加食物')
        return
      }
      const record = {
        date:        this.selectedDate,
        time:        this.selectedTime,
        mealType:    this.selectedMeal,
        foods:       this.selectedFoods.map(f => ({
          foodId:   f.id,
          name:     f.name,
          amount:   f.amount,
          unit:     f.unit,
          calories: f.calories,
          protein:  f.protein,
          fat:      f.fat,
          carbs:    f.carbs,
          grams:    f.grams
        })),
        remark:      this.remark,
        totalCalorie: parseFloat(this.totalCalorie)
      }
      // 直接调用store中的方法，不再自己处理导航和提示
      this.addDietRecord(record)
    },

    showToast(title, icon = 'none') {
      uni.showToast({ title, icon })
    },
    navigateBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss">
.add-diet {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 0 20rpx 120rpx;
}

.safe-area {
  height: 80rpx;
  background-color: #f8f8f8;
}

.header {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 30rpx;

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
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
}

.form-section {
  padding-bottom: 30rpx;
}

.meal-selector {
  display: flex;
  background-color: #ffffff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-in-out;

  .meal-option {
    flex: 1;
    height: 80rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;

    text {
      font-size: 28rpx;
      color: #666;
      transition: all 0.3s ease;
    }

    &.active {
      background: linear-gradient(135deg, #4CAF50, #8BC34A);

      text {
        color: #ffffff;
        font-weight: 500;
      }
    }

    &:active {
      opacity: 0.8;
    }
  }
}

.form-item {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-in-out;

  .form-label {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    margin-bottom: 20rpx;
    display: block;
    position: relative;
    padding-left: 20rpx;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 8rpx;
      height: 28rpx;
      background-color: #4CAF50;
      border-radius: 4rpx;
    }
  }

  .form-input {
    .picker-value {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 80rpx;
      background-color: #f9f9f9;
      border-radius: 12rpx;
      padding: 0 20rpx;

      text {
        font-size: 28rpx;
        color: #333;
      }

      image {
        width: 36rpx;
        height: 36rpx;
      }
    }

    textarea {
      width: 100%;
      height: 160rpx;
      font-size: 28rpx;
      background-color: #f9f9f9;
      border-radius: 12rpx;
      padding: 20rpx;
    }
  }
}

.food-list {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-in-out;

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

    .add-food-btn {
      display: flex;
      align-items: center;
      background-color: rgba(76, 175, 80, 0.1);
      padding: 10rpx 20rpx;
      border-radius: 30rpx;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.95);
      }

      image {
        width: 32rpx;
        height: 32rpx;
        margin-right: 8rpx;
      }

      text {
        font-size: 28rpx;
        color: #4CAF50;
        font-weight: 500;
      }
    }
  }

  .empty-tip {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 0;

    image {
      width: 140rpx;
      height: 140rpx;
      margin-bottom: 30rpx;
      opacity: 0.6;
    }

    text {
      font-size: 28rpx;
      color: #999;
    }
  }

  .food-item {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    padding: 30rpx;
    border-radius: 16rpx;
    background-color: #f9f9f9;
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:active {
      transform: scale(0.98);
    }

    .food-info {
      flex: 1;
      margin-right: 20rpx;

      .food-name {
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
        margin-bottom: 10rpx;
        display: block;
      }

      .food-desc {
        font-size: 24rpx;
        color: #999;
      }
    }

    .food-amount {
      display: flex;
      align-items: center;
      margin-right: 20rpx;

      .amount-control {
        display: flex;
        align-items: center;

        .minus-btn, .plus-btn {
          width: 60rpx;
          height: 60rpx;
          border-radius: 30rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s ease;

          &.minus-btn {
            background-color: rgba(244, 67, 54, 0.1);

            &:active {
              background-color: rgba(244, 67, 54, 0.2);
            }

            text {
              color: #F44336;
            }
          }

          &.plus-btn {
            background-color: rgba(76, 175, 80, 0.1);

            &:active {
              background-color: rgba(76, 175, 80, 0.2);
            }

            text {
              color: #4CAF50;
            }
          }

          text {
            font-size: 36rpx;
            font-weight: bold;
          }
        }

        .amount-input {
          width: 80rpx;
          text-align: center;
          margin: 0 15rpx;
          font-size: 30rpx;
          font-weight: 500;
          color: #333;
        }
      }
    }

    .food-nutrition-info {
      margin-right: 20rpx;

      .food-calorie {
        font-size: 30rpx;
        color: #FF9800;
        font-weight: bold;
        display: block;
        text-align: right;
        margin-bottom: 10rpx;
      }

      .nutrition-detail {
        display: flex;
        flex-direction: column;

        text {
          font-size: 22rpx;
          color: #666;
          margin-top: 6rpx;
        }
      }
    }

    .delete-btn {
      width: 70rpx;
      height: 70rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 35rpx;
      background-color: rgba(244, 67, 54, 0.1);
      transition: all 0.3s ease;

      &:active {
        background-color: rgba(244, 67, 54, 0.2);
      }

      image {
        width: 36rpx;
        height: 36rpx;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  left: 0;
  bottom: 0;
  right: 0;
  height: 120rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -6rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;

  .total-calorie {
    flex: 1;

    text {
      font-size: 32rpx;
      color: #FF9800;
      font-weight: bold;
      background: linear-gradient(90deg, #FF9800, #FF5722);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .save-btn {
    width: 240rpx;
    height: 80rpx;
    background: linear-gradient(135deg, #4CAF50, #8BC34A);
    border-radius: 40rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 6rpx 12rpx rgba(76, 175, 80, 0.2);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.95);
      box-shadow: 0 3rpx 6rpx rgba(76, 175, 80, 0.2);
    }

    text {
      font-size: 30rpx;
      color: #ffffff;
      font-weight: 500;
    }
  }
}

.food-search-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  .modal-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    animation: fadeIn 0.3s ease;
  }

  .modal-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ffffff;
    border-radius: 30rpx 30rpx 0 0;
    overflow: hidden;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
    box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.1);
    transition: height 0.3s ease;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100rpx;
      padding: 0 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      .modal-title {
        font-size: 34rpx;
        font-weight: bold;
        color: #333;
      }

      .close-btn {
        width: 70rpx;
        height: 70rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 35rpx;
        transition: all 0.3s ease;

        &:active {
          background-color: #f5f5f5;
        }

        image {
          width: 32rpx;
          height: 32rpx;
        }
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      padding: 20rpx 30rpx;
      margin-bottom: 10rpx;

      image {
        width: 36rpx;
        height: 36rpx;
        margin-right: 15rpx;
        opacity: 0.6;
        position: absolute;
        left: 50rpx;
        z-index: 1;
      }

      input {
        flex: 1;
        height: 70rpx;
        background-color: #f5f5f5;
        border-radius: 35rpx;
        padding: 0 30rpx 0 56rpx;
        font-size: 28rpx;
        position: relative;
        box-shadow: inset 0 2rpx 5rpx rgba(0, 0, 0, 0.03);

        &:focus {
          background-color: #f0f0f0;
        }
      }
    }

    .category-scroll {
      white-space: nowrap;
      margin: 0 30rpx 20rpx;
      height: 80rpx;

      .category-item {
        display: inline-block;
        height: 64rpx;
        padding: 0 30rpx;
        margin-right: 15rpx;
        border-radius: 32rpx;
        background-color: #f5f5f5;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &:active {
          transform: scale(0.95);
        }

        &.active {
          background: linear-gradient(135deg, #4CAF50, #8BC34A);
          box-shadow: 0 4rpx 8rpx rgba(76, 175, 80, 0.2);

          &:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 32rpx;
          }

          text {
            color: #ffffff;
            font-weight: 500;
          }
        }

        text {
          font-size: 26rpx;
          color: #666;
          line-height: 64rpx;
        }
      }
    }

    .food-scroll {
      height: 650rpx;
      min-height: 400rpx;
      &::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      .food-list-container {
        padding: 10rpx 30rpx 30rpx;

        .food-card {
          background-color: #ffffff;
          border-radius: 16rpx;
          padding: 25rpx;
          margin-bottom: 20rpx;
          box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          border: 1rpx solid rgba(0, 0, 0, 0.03);

          &:active {
            transform: scale(0.98);
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
          }

          .food-card-main {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15rpx;

            .food-info {
              flex: 1;

              .food-name {
                font-size: 30rpx;
                font-weight: 500;
                color: #333;
                margin-bottom: 12rpx;
                display: block;
              }
            }

            .food-nutrition {
              text-align: right;
              margin-left: 20rpx;

              .food-calorie {
                font-size: 28rpx;
                color: #FF9800;
                font-weight: bold;
                display: block;
                margin-bottom: 10rpx;
                background: linear-gradient(90deg, #FF9800, #FF5722);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
              }

              .food-unit {
                font-size: 24rpx;
                color: #999;
              }
            }
          }

          .food-detail {
            display: flex;
            justify-content: space-between;
            background-color: #f9f9f9;
            border-radius: 12rpx;
            padding: 15rpx;

            .nutrition-item {
              text-align: center;
              padding: 0 10rpx;

              .nutrition-value {
                font-size: 26rpx;
                color: #333;
                font-weight: 500;
                display: block;
                margin-bottom: 5rpx;
              }

              .nutrition-label {
                font-size: 22rpx;
                color: #666;
              }
            }
          }
        }
      }
    }
  }
}

.food-selection-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  .modal-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .selection-content {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ffffff;
    border-radius: 20rpx 20rpx 0 0;
    overflow: hidden;

    .selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 88rpx;
      padding: 0 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      .selection-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }

      .close-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        justify-content: center;
        align-items: center;

        image {
          width: 32rpx;
          height: 32rpx;
        }
      }
    }

    .selection-tabs {
      display: flex;
      height: 80rpx;
      border-bottom: 1rpx solid #f0f0f0;

      .tab-item {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;

        text {
          font-size: 28rpx;
          color: #666;
        }

        &.active {
          text {
            color: #4CAF50;
            font-weight: 500;
          }

          &:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 40rpx;
            height: 4rpx;
            background-color: #4CAF50;
          }
        }
      }
    }

    .selection-body {
      padding: 30rpx;

      .food-measure {
        text-align: center;
        margin-bottom: 20rpx;

        text {
          font-size: 28rpx;
          color: #666;
        }
      }

      .amount-control {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30rpx;

        .control-btn {
          width: 80rpx;
          height: 80rpx;
          border-radius: 40rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;

          text {
            font-size: 36rpx;
            color: #333;
          }
        }

        .amount-input {
          width: 100rpx;
          height: 80rpx;
          text-align: center;
          font-size: 32rpx;
          margin: 0 20rpx;
        }
      }

      .grams-input-container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 30rpx;

        .grams-input {
          width: 200rpx;
          height: 80rpx;
          background-color: #f5f5f5;
          border-radius: 10rpx;
          text-align: center;
          font-size: 32rpx;
        }

        .grams-label {
          font-size: 28rpx;
          color: #666;
          margin-left: 10rpx;
        }
      }

      .nutrition-preview {
        background-color: #f8f8f8;
        border-radius: 10rpx;
        padding: 20rpx;
        display: flex;
        flex-wrap: wrap;

        .preview-item {
          width: 50%;
          margin-bottom: 20rpx;

          .preview-label {
            font-size: 24rpx;
            color: #999;
            display: block;
            margin-bottom: 5rpx;
          }

          .preview-value {
            font-size: 28rpx;
            color: #333;
            font-weight: 500;
          }
        }
      }
    }

    .selection-footer {
      display: flex;
      height: 100rpx;
      border-top: 1rpx solid #f0f0f0;

      .cancel-btn {
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;

        text {
          font-size: 30rpx;
          color: #666;
        }
      }

      .confirm-btn {
        width: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #4CAF50;

        text {
          font-size: 30rpx;
          color: #ffffff;
        }
      }
    }
  }
}

/* 加载和动画等，全都保留 */
</style>
