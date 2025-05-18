<template>
  <view class="settings">
    <view class="section">
      <view class="section-header">
        <text class="section-title">通知设置</text>
      </view>
      
      <view class="setting-item">
        <text class="setting-label">每日打卡提醒</text>
        <switch :checked="settings.dailyReminder" color="#4CAF50" @change="onSwitchChange($event, 'dailyReminder')" />
      </view>
      
      <view class="setting-item">
        <text class="setting-label">营养摄入提醒</text>
        <switch :checked="settings.nutritionReminder" color="#4CAF50" @change="onSwitchChange($event, 'nutritionReminder')" />
      </view>
      
      <view class="setting-item">
        <text class="setting-label">饮水提醒</text>
        <switch :checked="settings.waterReminder" color="#4CAF50" @change="onSwitchChange($event, 'waterReminder')" />
      </view>
    </view>
    
    <view class="section">
      <view class="section-header">
        <text class="section-title">隐私设置</text>
      </view>
      
      <view class="setting-item">
        <text class="setting-label">允许数据分析</text>
        <switch :checked="settings.allowDataAnalysis" color="#4CAF50" @change="onSwitchChange($event, 'allowDataAnalysis')" />
      </view>
      
      <view class="setting-item">
        <text class="setting-label">允许推送个性化内容</text>
        <switch :checked="settings.allowPersonalization" color="#4CAF50" @change="onSwitchChange($event, 'allowPersonalization')" />
      </view>
    </view>
    
    <view class="section">
      <view class="section-header">
        <text class="section-title">应用设置</text>
      </view>
      
      <view class="setting-item">
        <text class="setting-label">清除缓存</text>
        <view class="setting-action" @click="clearCache">
          <text>{{ cacheSize }}</text>
          <image src="/static/icons/arrow-right.png"></image>
        </view>
      </view>
      
      <view class="setting-item">
        <text class="setting-label">检查更新</text>
        <view class="setting-action" @click="checkUpdate">
          <text>当前版本 v1.0.0</text>
          <image src="/static/icons/arrow-right.png"></image>
        </view>
      </view>
    </view>
    
    <view class="save-btn" @click="saveSettings">
      <text>保存设置</text>
    </view>
  </view>
</template>

<script>
import { mapActions } from 'vuex'
import { clearAvatarCache } from '@/utils/fileCache'

export default {
  data() {
    return {
      settings: {
        dailyReminder: true,
        nutritionReminder: true,
        waterReminder: false,
        allowDataAnalysis: true,
        allowPersonalization: true
      },
      cacheSize: '2.5MB'
    }
  },
  onLoad() {
    this.getSettings()
  },
  methods: {
    ...mapActions({
      updateUserSettings: 'user/updateUserSettings'
    }),
    getSettings() {
      // 实际项目中应该从后端获取设置
      // 这里使用模拟数据
      setTimeout(() => {
        this.settings = {
          dailyReminder: true,
          nutritionReminder: true,
          waterReminder: false,
          allowDataAnalysis: true,
          allowPersonalization: true
        }
      }, 500)
    },
    onSwitchChange(e, key) {
      this.settings[key] = e.detail.value
    },
    clearCache() {
      uni.showModal({
        title: '提示',
        content: '确定要清除缓存吗？',
        success: res => {
          if (res.confirm) {
            // 显示加载中
            uni.showLoading({
              title: '清除中...'
            })
            
            // 清除头像缓存
            clearAvatarCache().then(() => {
              // 重置本地头像路径
              this.$store.commit('user/SET_LOCAL_AVATAR_PATH', '')
              // 设置头像需要更新
              this.$store.commit('user/SET_AVATAR_UPDATE_STATUS', true)
              
              // 隐藏加载
              uni.hideLoading()
              this.cacheSize = '0KB'
              uni.showToast({
                title: '清除成功',
                icon: 'success'
              })
            }).catch(err => {
              console.error('清除缓存失败:', err)
              uni.hideLoading()
              uni.showToast({
                title: '清除失败',
                icon: 'none'
              })
            })
          }
        }
      })
    },
    checkUpdate() {
      uni.showLoading({
        title: '检查中...'
      })
      
      setTimeout(() => {
        uni.hideLoading()
        uni.showModal({
          title: '检查更新',
          content: '当前已是最新版本',
          showCancel: false
        })
      }, 1000)
    },
    saveSettings() {
      // 调用 action 更新设置
      this.updateUserSettings(this.settings)
      
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  }
}
</script>

<style lang="scss">
.settings {
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

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  .setting-label {
    font-size: 28rpx;
    color: #333;
  }
  
  .setting-action {
    display: flex;
    align-items: center;
    
    text {
      font-size: 28rpx;
      color: #999;
      margin-right: 10rpx;
    }
    
    image {
      width: 24rpx;
      height: 24rpx;
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