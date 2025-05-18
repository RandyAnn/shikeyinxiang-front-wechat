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
import { downloadAndCacheAvatar, checkFileExists } from '@/utils/fileCache'

export default {
  data() {
    return {
      avatarRequestInProgress: false, // 添加请求锁，防止并发请求
      avatarRequestTimeoutId: null // 存储请求锁超时计时器ID
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.user.userInfo,
      isLogin: state => state.user.isLogin,
      avatarNeedsUpdate: state => state.user.avatarNeedsUpdate,
      localAvatarPath: state => state.user.localAvatarPath
    }),
    // 计算属性：返回要显示的头像路径（本地缓存或默认头像）
    avatarPath() {
      if (this.localAvatarPath) {
        return this.localAvatarPath
      }
      if (this.userInfo.avatar) {
        return this.userInfo.avatar
      }
      return '/static/images/default-avatar.png'
    }
  },
  watch: {
    isLogin(newVal) {
      if (newVal === true) {
        // 只在监听到 isLogin 变为 true 且没有进行中的请求时触发头像更新
        if (!this.avatarRequestInProgress) {
          this.checkAndUpdateAvatar()
        }
      }
    }
  },
  onLoad() {
    // 立即设置请求锁，让 onLoad 中的请求优先执行
    this.setRequestLock()

    // 如果 store 中已有数据，直接使用
    if (this.isLogin && this.userInfo) {
      if (this.avatarNeedsUpdate) {
        this.checkAndUpdateAvatar()
      }
      this.releaseRequestLock()
    } else {
      // 否则获取用户信息
      this.getUserInfo().then(() => {
        if (this.isLogin) {
          this.checkAndUpdateAvatar()
        } else {
          this.releaseRequestLock()
        }
      }).catch(err => {
        this.releaseRequestLock()
      })
    }
  },
  onShow() {
    // 页面显示时，如果已登录且头像需要更新且没有进行中的请求，才检查头像
    if (this.isLogin && this.avatarNeedsUpdate && !this.avatarRequestInProgress) {
      this.checkAndUpdateAvatar()
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
    // 设置请求锁并启动超时计时器
    setRequestLock() {
      this.avatarRequestInProgress = true
      // 清除可能存在的旧计时器
      if (this.avatarRequestTimeoutId) {
        clearTimeout(this.avatarRequestTimeoutId)
      }
      // 设置10秒超时，确保锁不会永久阻塞
      this.avatarRequestTimeoutId = setTimeout(() => {
        this.avatarRequestInProgress = false
        this.avatarRequestTimeoutId = null
      }, 10000) // 10秒超时
    },
    // 释放请求锁并清除计时器
    releaseRequestLock() {
      this.avatarRequestInProgress = false
      if (this.avatarRequestTimeoutId) {
        clearTimeout(this.avatarRequestTimeoutId)
        this.avatarRequestTimeoutId = null
      }
    },
    // 检查并更新头像
    async checkAndUpdateAvatar() {
      // 如果已经有请求在进行中，则退出
      if (this.avatarRequestInProgress && !this.avatarRequestTimeoutId) {
        return
      }

      // 设置请求锁
      this.setRequestLock()

      try {
        // 检查本地缓存是否存在
        const hasLocalAvatar = await checkFileExists(this.localAvatarPath)

        // 如果本地头像不存在或需要更新，则获取远程头像
        if (!hasLocalAvatar || this.avatarNeedsUpdate) {

          // 如果没有头像URL，先获取
          if (!this.userInfo.avatar) {
            const res = await getUserAvatar()
            if (res.data && res.data.avatarUrl) {
              // 更新头像URL到store
              this.$store.commit('user/SET_USER_INFO', {
                ...this.userInfo,
                avatar: res.data.avatarUrl
              })

              // 下载并缓存头像
              const localPath = await downloadAndCacheAvatar(res.data.avatarUrl)
              this.$store.commit('user/SET_LOCAL_AVATAR_PATH', localPath)
            }
          } else {
            // 有头像URL但本地缓存不存在，直接下载
            const localPath = await downloadAndCacheAvatar(this.userInfo.avatar)
            this.$store.commit('user/SET_LOCAL_AVATAR_PATH', localPath)
          }

          // 设置头像不需要更新
          this.$store.commit('user/SET_AVATAR_UPDATE_STATUS', false)
        }
      } catch (error) {
        // 出错处理
      } finally {
        // 无论成功失败，都释放请求锁并清除计时器
        this.releaseRequestLock()
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