<template>
  <view class="mine">
    <!-- 顶部安全区域 -->
    <view class="safe-area"></view>

    <!-- 顶部用户信息 -->
    <view class="user-info">
      <view class="avatar-container" @click="navigateTo('/pages/mine/profile')">
        <image class="avatar" :src="avatarPath"></image>
      </view>
      <view class="user-detail">
        <text class="nickname">{{ userInfo.username || '未登录' }}</text>
      </view>
      <view class="edit-btn" @click="navigateTo('/pages/mine/profile')">
        <image src="/static/icons/edit.png"></image>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list">
      <view class="menu-section">
        <view class="menu-item" @click="navigateTo('/pages/mine/goal')">
          <view class="menu-icon">
            <image src="/static/icons/goal.png"></image>
          </view>
          <view class="menu-content">
            <text class="menu-title">饮食目标</text>
            <text class="menu-desc">设置每日营养摄入目标</text>
          </view>
          <view class="menu-arrow">
            <image src="/static/icons/arrow-right.png"></image>
          </view>
        </view>

        <view class="menu-item" @click="navigateTo('/pages/mine/settings')">
          <view class="menu-icon">
            <image src="/static/icons/settings.png"></image>
          </view>
          <view class="menu-content">
            <text class="menu-title">设置</text>
            <text class="menu-desc">通知、隐私等设置</text>
          </view>
          <view class="menu-arrow">
            <image src="/static/icons/arrow-right.png"></image>
          </view>
        </view>
      </view>

      <view class="menu-section">
        <view class="menu-item" @click="showFeedback()">
          <view class="menu-icon">
            <image src="/static/icons/feedback.png"></image>
          </view>
          <view class="menu-content">
            <text class="menu-title">意见反馈</text>
            <text class="menu-desc">帮助我们改进产品</text>
          </view>
          <view class="menu-arrow">
            <image src="/static/icons/arrow-right.png"></image>
          </view>
        </view>

        <view class="menu-item" @click="showAbout()">
          <view class="menu-icon">
            <image src="/static/icons/about.png"></image>
          </view>
          <view class="menu-content">
            <text class="menu-title">关于我们</text>
            <text class="menu-desc">了解更多信息</text>
          </view>
          <view class="menu-arrow">
            <image src="/static/icons/arrow-right.png"></image>
          </view>
        </view>
      </view>

      <view class="logout-btn" @click="logout" v-if="isLogin">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { getUserAvatar } from '@/api/user'

export default {
  computed: {
    ...mapState({
      userInfo: state => state.user.userInfo,
      isLogin: state => state.user.isLogin
    }),
    // 简化的头像路径计算：直接使用远程URL或默认头像
    avatarPath() {
      return this.userInfo.avatar || '/static/images/default-avatar.png'
    }
  },
  onLoad() {
    // 如果已登录但没有头像URL，异步获取
    if (this.isLogin && !this.userInfo.avatar) {
      this.loadAvatarUrl()
    }
  },
  onShow() {
    // 页面显示时，如果已登录但没有头像URL，异步获取
    if (this.isLogin && !this.userInfo.avatar) {
      this.loadAvatarUrl()
    }
  },
  methods: {
    ...mapActions({
      getUserInfo: 'user/getUserInfo',
      logoutAction: 'user/logout'
    }),
    navigateTo(url) {
      uni.navigateTo({
        url
      })
    },
    // 简化的头像URL加载方法
    async loadAvatarUrl() {
      try {
        const res = await getUserAvatar()
        if (res.data && res.data.avatarUrl) {
          // 更新头像URL到store
          this.$store.commit('user/SET_USER_INFO', {
            ...this.userInfo,
            avatar: res.data.avatarUrl
          })
        }
      } catch (error) {
        console.log('获取头像URL失败', error)
        // 静默失败，使用默认头像
      }
    },
    showFeedback() {
      uni.showModal({
        title: '意见反馈',
        content: '感谢您的反馈，我们将不断改进产品！',
        showCancel: false
      })
    },
    showAbout() {
      uni.showModal({
        title: '关于我们',
        content: '饮食记录小程序 v1.0.0\n帮助您记录饮食，改善健康',
        showCancel: false
      })
    },
    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: res => {
          if (res.confirm) {
            this.logoutAction()
            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          }
        }
      })
    }
  }
}
</script>

<style lang="scss">
.mine {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.safe-area {
  height: 80rpx; /* 与其他页面保持一致的顶部安全区域高度 */
  background-color: #4CAF50;
}

.user-info {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx 30rpx;
  background-color: #4CAF50;

  .avatar-container {
    margin-right: 25rpx;

    .avatar {
      width: 110rpx;
      height: 110rpx;
      border-radius: 55rpx;
      border: 4rpx solid #ffffff;
    }
  }

  .user-detail {
    flex: 1;

    .nickname {
      font-size: 34rpx;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 15rpx;
    }

    .user-stats {
      display: flex;

      .stat-item {
        margin-right: 25rpx;

        .stat-value {
          font-size: 30rpx;
          color: #ffffff;
          font-weight: bold;
          display: block;
        }

        .stat-label {
          font-size: 22rpx;
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  .edit-btn {
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
}

.menu-list {
  padding: 20rpx;

  .menu-section {
    background-color: #ffffff;
    border-radius: 10rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .menu-icon {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 20rpx;

      image {
        width: 40rpx;
        height: 40rpx;
      }
    }

    .menu-content {
      flex: 1;

      .menu-title {
        font-size: 30rpx;
        color: #333;
        margin-bottom: 6rpx;
        display: block;
      }

      .menu-desc {
        font-size: 24rpx;
        color: #999;
      }
    }

    .menu-arrow {
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
  }

  .logout-btn {
    margin-top: 60rpx;
    background-color: #ffffff;
    border-radius: 10rpx;
    padding: 30rpx;
    text-align: center;

    text {
      font-size: 32rpx;
      color: #FF5252;
    }
  }
}
</style>