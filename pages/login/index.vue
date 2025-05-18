<template>
  <view class="login">
    <!-- 自定义导航栏，只显示标题 -->
    <view class="custom-nav">
      <view class="nav-title">登录</view>
    </view>

    <view class="logo-container">
      <image class="logo" src="/static/images/logo.png"></image>
      <text class="app-name">饮食记录</text>
    </view>

    <view class="login-form" v-if="loginType === 'email'">
      <view class="form-item">
        <input class="input" v-model="email" placeholder="请输入邮箱" />
      </view>
      <view class="form-item password-input">
        <input class="input" v-model="password" :password="!showPassword" placeholder="请输入密码" />
        <view class="toggle-password" @click.stop="togglePassword">
          <image :src="showPassword ? '/static/icons/eye-open.png' : '/static/icons/eye-close.png'" class="eye-icon" mode="aspectFit"></image>
        </view>
      </view>
      <button class="login-btn" @click="emailLogin" :disabled="loading">
        <text v-if="!loading">登录</text>
        <view class="loading" v-else></view>
      </button>
      <view class="switch-login-type" @click="loginType = 'wechat'">
        <text>使用微信一键登录</text>
      </view>
    </view>

    <view class="wechat-login" v-else>
      <button class="wechat-btn" open-type="getUserInfo" @getuserinfo="getWXUserInfo" :disabled="loading">
        <image src="/static/icons/wechat.png" class="wechat-icon"></image>
        <text v-if="!loading">微信一键登录</text>
        <view class="loading" v-else></view>
      </button>
      <view class="switch-login-type" @click="loginType = 'email'">
        <text>使用邮箱密码登录</text>
      </view>
    </view>

    <view class="agreement">
      <text class="agreement-text">登录即表示您同意</text>
      <text class="agreement-link" @click="showUserAgreement">《用户协议》</text>
      <text class="agreement-text">和</text>
      <text class="agreement-link" @click="showPrivacyPolicy">《隐私政策》</text>
    </view>
  </view>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      loginType: 'wechat', // 'wechat' 或 'email'
      email: '',
      password: '',
      wxUserInfo: null,
      showPassword: false
    }
  },
  computed: {
    ...mapState({
      loading: state => state.user.loading
    })
  },
  methods: {
    ...mapActions({
      login: 'user/login',
      wechatLoginAction: 'user/wechatLogin'
    }),
    emailLogin() {
      if (!this.email || !this.password) {
        uni.showToast({
          title: '请输入邮箱和密码',
          icon: 'none'
        })
        return
      }

      // 调用登录接口
      this.login({
        email: this.email,
        password: this.password
      })
        .then(() => {
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })

          // 确保使用reLaunch而不是switchTab，彻底重新加载首页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)
        })
        .catch(err => {
          // 显示具体的错误信息
          uni.showToast({
            title: err.message || '登录失败',
            icon: 'none'
          })
          // 不再进行页面跳转
        })
    },
    // 微信登录第一步：获取用户信息
    getWXUserInfo(e) {
      if (e.detail.errMsg !== 'getUserInfo:ok') {
        uni.showToast({
          title: '授权失败',
          icon: 'none'
        })
        return
      }

      this.wxUserInfo = e.detail

      // 获取微信登录凭证
      uni.login({
        provider: 'weixin',
        success: (loginRes) => {
          if (loginRes.code) {
            this.wechatLoginWithCode(loginRes.code)
          } else {
            uni.showToast({
              title: '微信登录失败',
              icon: 'none'
            })
          }
        },
        fail: () => {
          uni.showToast({
            title: '微信登录失败',
            icon: 'none'
          })
        }
      })
    },
    // 微信登录第二步：使用code调用后端接口
    wechatLoginWithCode(code) {
      // 调用微信登录接口
      this.wechatLoginAction({
        code: code,
        encryptedData: this.wxUserInfo.encryptedData,
        iv: this.wxUserInfo.iv
      })
        .then(() => {
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })

          // 确保使用reLaunch而不是switchTab，彻底重新加载首页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }, 1500)
        })
        .catch(err => {
          uni.showToast({
            title: err.message || '登录失败',
            icon: 'none'
          })
        })
    },
    showUserAgreement() {
      uni.showModal({
        title: '用户协议',
        content: '这是用户协议内容...',
        showCancel: false
      })
    },
    showPrivacyPolicy() {
      uni.showModal({
        title: '隐私政策',
        content: '这是隐私政策内容...',
        showCancel: false
      })
    },
    togglePassword() {
      console.log('togglePassword called, current state:', this.showPassword)
      this.showPassword = !this.showPassword
      console.log('new state:', this.showPassword)
    }
  }
}
</script>

<style lang="scss">
.login {
  min-height: 100vh;
  padding: 40rpx;
  padding-top: 0; /* 移除上边距，为导航栏留出空间 */
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 自定义导航栏样式 */
.custom-nav {
  width: 100%;
  padding-top: var(--status-bar-height, 20px);
  height: 70px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: #ffffff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.nav-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  padding-bottom: 15px;
}

.logo-container {
  margin-top: calc(var(--status-bar-height, 20px) + 70px + 40rpx);
  margin-bottom: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .logo {
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 20rpx;
  }

  .app-name {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.login-form {
  width: 100%;

  .form-item {
    margin-bottom: 30rpx;

    .input {
      width: 100%;
      height: 90rpx;
      background-color: #f8f8f8;
      border-radius: 45rpx;
      padding: 0 40rpx;
      font-size: 28rpx;
    }
  }

  .login-btn {
    width: 100%;
    height: 90rpx;
    background-color: #4CAF50;
    color: #ffffff;
    border-radius: 45rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32rpx;
    font-weight: bold;
    margin-top: 40rpx;
    margin-bottom: 30rpx;

    &[disabled] {
      background-color: #a5d6a7;
    }
  }
}

.wechat-login {
  width: 100%;

  .wechat-btn {
    width: 100%;
    height: 90rpx;
    background-color: #07C160;
    color: #ffffff;
    border-radius: 45rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32rpx;
    font-weight: bold;
    margin-bottom: 30rpx;

    &[disabled] {
      background-color: #7fccb5;
    }

    .wechat-icon {
      width: 40rpx;
      height: 40rpx;
      margin-right: 10rpx;
    }
  }
}

.switch-login-type {
  text-align: center;
  margin-bottom: 40rpx;

  text {
    font-size: 28rpx;
    color: #4CAF50;
  }
}

.agreement {
  position: absolute;
  bottom: 60rpx;
  left: 0;
  right: 0;
  text-align: center;

  .agreement-text {
    font-size: 24rpx;
    color: #999;
  }

  .agreement-link {
    font-size: 24rpx;
    color: #4CAF50;
  }
}

.loading {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.password-input {
  position: relative;

  .toggle-password {
    position: absolute;
    right: 40rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    background-color: transparent;

    .eye-icon {
      width: 32rpx;
      height: 32rpx;
    }
  }
}
</style>