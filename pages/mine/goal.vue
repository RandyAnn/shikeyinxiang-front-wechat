<template>
  <view class="goal-setting">
    <view class="section">
      <view class="section-header">
        <text class="section-title">基础目标</text>
      </view>

      <view class="form-item">
        <text class="form-label">每日热量目标</text>
        <view class="form-input">
          <input type="number" v-model="calorieTarget" placeholder="输入目标热量" />
          <text class="unit">千卡</text>
        </view>
      </view>


    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">营养素目标</text>
      </view>

      <view class="form-item">
        <text class="form-label">蛋白质</text>
        <view class="form-input">
          <input type="number" v-model="nutritionGoals.protein" placeholder="输入蛋白质目标" />
          <text class="unit">g</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">碳水化合物</text>
        <view class="form-input">
          <input type="number" v-model="nutritionGoals.carbs" placeholder="输入碳水目标" />
          <text class="unit">g</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">脂肪</text>
        <view class="form-input">
          <input type="number" v-model="nutritionGoals.fat" placeholder="输入脂肪目标" />
          <text class="unit">g</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="section-title">饮食偏好</text>
      </view>

      <view class="preference-list">
        <view class="preference-item" v-for="(item, index) in dietPreferences" :key="index" @click="togglePreference(index)">
          <text class="preference-name">{{ item.name }}</text>
          <switch :checked="item.selected" color="#4CAF50" @change="onSwitchChange($event, index)" />
        </view>
      </view>
    </view>

    <view class="save-btn" @click="saveGoals">
      <text>保存设置</text>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      calorieTarget: '',
      nutritionGoals: {
        protein: '',
        carbs: '',
        fat: ''
      },
      dietPreferences: []
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.user.userInfo,
      storeNutritionGoals: state => state.user.nutritionGoals,
      storeDietPreferences: state => state.user.dietPreferences
    })
  },
  onLoad() {
    this.initData()
  },
  methods: {
    ...mapActions({
      updateUserInfo: 'user/updateUserInfo',
      updateNutritionGoal: 'user/updateNutritionGoal',
      getNutritionGoal: 'user/getNutritionGoal'
    }),
    async initData() {
      try {
        // 显示加载中
        uni.showLoading({
          title: '加载中...',
          mask: true
        })

        // 先调用API获取最新数据
        await this.getNutritionGoal()

        // 然后用store中的最新数据更新页面
        this.calorieTarget = this.userInfo.calorieTarget || 2200

        // 营养目标
        this.nutritionGoals = {
          protein: this.storeNutritionGoals.protein || 65,
          carbs: this.storeNutritionGoals.carbs || 300,
          fat: this.storeNutritionGoals.fat || 70
        }

        // 饮食偏好
        this.dietPreferences = [...this.storeDietPreferences]
      } catch (error) {
        console.error('初始化数据失败', error)
        uni.showToast({
          title: '获取数据失败，请重试',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    togglePreference(index) {
      this.dietPreferences[index].selected = !this.dietPreferences[index].selected
    },
    onSwitchChange(e, index) {
      this.dietPreferences[index].selected = e.detail.value
    },
    async saveGoals() {
      // 验证输入
      if (!this.calorieTarget) {
        uni.showToast({
          title: '请输入热量目标',
          icon: 'none'
        })
        return
      }

      try {
        // 显示加载中
        uni.showLoading({
          title: '保存中...',
          mask: true
        })

        // 准备数据
        const data = {
          calorieTarget: Number(this.calorieTarget),
          nutritionGoals: {
            protein: Number(this.nutritionGoals.protein),
            carbs: Number(this.nutritionGoals.carbs),
            fat: Number(this.nutritionGoals.fat)
          },
          dietPreferences: this.dietPreferences
        }

        // 调用 Vuex action 保存数据
        await this.updateNutritionGoal(data)

        uni.showToast({
          title: '保存成功',
          icon: 'success'
        })

        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (error) {
        console.error('保存目标失败', error)
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    }
  }
}
</script>

<style lang="scss">
.goal-setting {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx;
}

.section {
  background-color: #ffffff;
  border-radius: 10rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .section-header {
    margin-bottom: 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;

  &:last-child {
    margin-bottom: 0;
  }

  .form-label {
    width: 200rpx;
    font-size: 28rpx;
    color: #333;
  }

  .form-input {
    flex: 1;
    display: flex;
    align-items: center;
    border-bottom: 1rpx solid #e0e0e0;
    padding: 10rpx 0;

    input {
      flex: 1;
      height: 60rpx;
      font-size: 28rpx;
    }

    .unit {
      font-size: 28rpx;
      color: #999;
      margin-left: 10rpx;
    }
  }
}

.preference-list {
  .preference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .preference-name {
      font-size: 28rpx;
      color: #333;
    }
  }
}

.save-btn {
  background-color: #4CAF50;
  border-radius: 10rpx;
  padding: 30rpx;
  text-align: center;
  margin-top: 60rpx;

  text {
    font-size: 32rpx;
    color: #ffffff;
  }
}
</style>