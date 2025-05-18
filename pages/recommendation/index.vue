<template>
  <view class="recommendation">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">智能推荐</text>
    </view>
    
    <!-- 推荐一日三餐 -->
    <view class="daily-meals">
      <view class="section-header">
        <text class="section-title">今日推荐</text>
        <view class="refresh-btn" @click="refreshRecommendations">
          <image src="/static/icons/refresh.png"></image>
          <text>换一换</text>
        </view>
      </view>
      
      <view class="meal-list">
        <view class="meal-item" v-for="(meal, index) in recommendedMeals" :key="index">
          <view class="meal-header">
            <text class="meal-type">{{ meal.type }}</text>
            <text class="meal-calorie">{{ meal.totalCalorie }}千卡</text>
          </view>
          
          <scroll-view scroll-x class="food-scroll">
            <view class="food-list">
              <view class="food-item" v-for="(food, foodIndex) in meal.foods" :key="foodIndex" @click="addFoodToRecord(food, meal.typeKey)">
                <image class="food-image" :src="food.image"></image>
                <view class="food-info">
                  <text class="food-name">{{ food.name }}</text>
                  <text class="food-calorie">{{ food.calorie }}千卡</text>
                </view>
                <view class="add-btn">
                  <image src="/static/icons/add-small.png"></image>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
    
    <!-- 按目标推荐 -->
    <view class="goal-recommendations">
      <view class="section-header">
        <text class="section-title">按目标推荐</text>
      </view>
      
      <view class="goal-tabs">
        <view 
          class="goal-tab" 
          v-for="(goal, index) in goals" 
          :key="index"
          :class="{ active: activeGoal === goal.key }"
          @click="changeGoal(goal.key)"
        >
          <text>{{ goal.name }}</text>
        </view>
      </view>
      
      <view class="recipe-grid">
        <view class="recipe-item" v-for="(recipe, index) in goalRecipes" :key="index" @click="viewRecipeDetail(recipe)">
          <image class="recipe-image" :src="recipe.image"></image>
          <view class="recipe-info">
            <text class="recipe-name">{{ recipe.name }}</text>
            <view class="recipe-tags">
              <text class="recipe-tag" v-for="(tag, tagIndex) in recipe.tags" :key="tagIndex">{{ tag }}</text>
            </view>
            <view class="recipe-bottom">
              <text class="recipe-calorie">{{ recipe.calorie }}千卡</text>
              <view class="add-btn" @click.stop="addRecipeToRecord(recipe)">
                <image src="/static/icons/add-small.png"></image>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      activeGoal: 'balance',
      goals: [
        { key: 'balance', name: '均衡饮食' },
        { key: 'lowfat', name: '低脂减肥' },
        { key: 'protein', name: '高蛋白' },
        { key: 'muscle', name: '增肌' }
      ],
      recommendedMeals: [
        {
          type: '早餐',
          typeKey: 'breakfast',
          totalCalorie: 560,
          foods: [
            { id: 1, name: '全麦面包', calorie: 200, image: '/static/images/foods/bread.jpg' },
            { id: 2, name: '煮鸡蛋', calorie: 80, image: '/static/images/foods/egg.jpg' },
            { id: 3, name: '牛奶', calorie: 150, image: '/static/images/foods/milk.jpg' },
            { id: 4, name: '香蕉', calorie: 130, image: '/static/images/foods/banana.jpg' }
          ]
        },
        {
          type: '午餐',
          typeKey: 'lunch',
          totalCalorie: 600,
          foods: [
            { id: 5, name: '米饭', calorie: 200, image: '/static/images/foods/rice.jpg' },
            { id: 6, name: '清炒青菜', calorie: 50, image: '/static/images/foods/vegetables.jpg' },
            { id: 7, name: '红烧排骨', calorie: 350, image: '/static/images/foods/ribs.jpg' }
          ]
        },
        {
          type: '晚餐',
          typeKey: 'dinner',
          totalCalorie: 550,
          foods: [
            { id: 8, name: '米饭', calorie: 200, image: '/static/images/foods/rice.jpg' },
            { id: 9, name: '清蒸鱼', calorie: 180, image: '/static/images/foods/fish.jpg' },
            { id: 10, name: '西红柿炒鸡蛋', calorie: 170, image: '/static/images/foods/tomato-egg.jpg' }
          ]
        }
      ],
      goalRecipes: [
        {
          id: 1,
          name: '白切鸡',
          calorie: 560,
          image: '/static/images/recipes/recipe1.jpg',
          tags: ['高蛋白', '低脂']
        },
        {
          id: 2,
          name: '炒青菜',
          calorie: 600,
          image: '/static/images/recipes/recipe2.jpg',
          tags: ['低卡', '维生素']
        },
        {
          id: 3,
          name: '番茄炒蛋',
          calorie: 450,
          image: '/static/images/recipes/recipe3.jpg',
          tags: ['简单', '快手']
        },
        {
          id: 4,
          name: '清蒸鱼',
          calorie: 380,
          image: '/static/images/recipes/recipe4.jpg',
          tags: ['高蛋白', '低脂']
        }
      ]
    }
  },
  computed: {
    ...mapState({
      recommendedRecipes: state => state.recommendation.recommendedRecipes
    })
  },
  onLoad() {
    this.fetchRecommendedRecipes()
  },
  methods: {
    ...mapActions({
      fetchRecommendedRecipes: 'recommendation/fetchRecommendedRecipes'
    }),
    refreshRecommendations() {
      uni.showLoading({
        title: '加载中...'
      })
      
      setTimeout(() => {
        uni.hideLoading()
        uni.showToast({
          title: '推荐已更新',
          icon: 'success'
        })
      }, 1000)
    },
    changeGoal(goal) {
      this.activeGoal = goal
      
      // 实际项目中应该根据目标获取不同的推荐
      uni.showLoading({
        title: '加载中...'
      })
      
      setTimeout(() => {
        uni.hideLoading()
      }, 500)
    },
    addFoodToRecord(food, mealType) {
      uni.showToast({
        title: `已添加${food.name}到${this.getMealTypeName(mealType)}`,
        icon: 'success'
      })
      
      // 实际项目中应该调用添加饮食记录的接口
    },
    addRecipeToRecord(recipe) {
      uni.showToast({
        title: `已添加${recipe.name}到饮食记录`,
        icon: 'success'
      })
      
      // 实际项目中应该调用添加饮食记录的接口
    },
    viewRecipeDetail(recipe) {
      // 实际项目中应该跳转到食谱详情页
      uni.showModal({
        title: recipe.name,
        content: `这是一道${recipe.calorie}千卡的美食，点击确定查看详情。`,
        success: function(res) {
          if (res.confirm) {
            console.log('用户点击确定')
          }
        }
      })
    },
    getMealTypeName(type) {
      const mealTypes = {
        breakfast: '早餐',
        lunch: '午餐',
        dinner: '晚餐',
        snacks: '加餐'
      }
      return mealTypes[type] || type
    }
  }
}
</script>

<style lang="scss">
.recommendation {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.header {
  padding: 20rpx 0;
  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .section-desc {
    font-size: 24rpx;
    color: #999;
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    
    image {
      width: 32rpx;
      height: 32rpx;
      margin-right: 8rpx;
    }
    
    text {
      font-size: 28rpx;
      color: #4CAF50;
    }
  }
}

.daily-meals, .goal-recommendations, .personalized-recommendations {
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.meal-list {
  .meal-item {
    margin-bottom: 30rpx;
    
    .meal-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20rpx;
      
      .meal-type {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
      }
      
      .meal-calorie {
        font-size: 28rpx;
        color: #999;
      }
    }
    
    .food-scroll {
      width: 100%;
      white-space: nowrap;
    }
    
    .food-list {
      display: inline-flex;
      padding: 10rpx 0;
    }
    
    .food-item {
      margin-right: 30rpx;
      width: 200rpx;
      position: relative;
      
      .food-image {
        width: 200rpx;
        height: 150rpx;
        border-radius: 10rpx;
      }
      
      .food-info {
        padding: 10rpx 0;
        
        .food-name {
          font-size: 28rpx;
          color: #333;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .food-calorie {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .add-btn {
        position: absolute;
        right: 10rpx;
        top: 10rpx;
        width: 40rpx;
        height: 40rpx;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 20rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        
        image {
          width: 24rpx;
          height: 24rpx;
        }
      }
    }
  }
}

.goal-tabs {
  display: flex;
  margin-bottom: 30rpx;
  
  .goal-tab {
    padding: 15rpx 30rpx;
    margin-right: 20rpx;
    border-radius: 30rpx;
    background-color: #f0f0f0;
    
    text {
      font-size: 28rpx;
      color: #666;
    }
    
    &.active {
      background-color: #4CAF50;
      
      text {
        color: #ffffff;
      }
    }
  }
}

.recipe-grid {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;
  
  .recipe-item {
    width: calc(50% - 20rpx);
    margin: 10rpx;
    background-color: #ffffff;
    border-radius: 10rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
    
    .recipe-image {
      width: 100%;
      height: 200rpx;
    }
    
    .recipe-info {
      padding: 20rpx;
      
      .recipe-name {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 10rpx;
        display: block;
      }
      
      .recipe-tags {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 10rpx;
        
        .recipe-tag {
          font-size: 22rpx;
          color: #4CAF50;
          background-color: #E8F5E9;
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          margin-right: 10rpx;
          margin-bottom: 10rpx;
        }
      }
      
      .recipe-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .recipe-calorie {
          font-size: 24rpx;
          color: #999;
        }
        
        .add-btn {
          width: 40rpx;
          height: 40rpx;
          background-color: #4CAF50;
          border-radius: 20rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          
          image {
            width: 24rpx;
            height: 24rpx;
          }
        }
      }
    }
  }
}
</style> 