import Vue from 'vue'
import App from './App'
import store from './store'
import { isTokenExpired } from './utils/request'

Vue.config.productionTip = false

// 添加全局错误处理
Vue.config.errorHandler = function(err, vm, info) {
  console.error('Vue错误:', err)
  console.info('错误信息:', info)
}

// 兼容处理
const systemInfo = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}
Vue.prototype.$systemInfo = systemInfo

// 全局混入
Vue.mixin({
  methods: {
    navigateTo(url) {
      uni.navigateTo({
        url
      })
    },
    navigateBack(delta = 1) {
      uni.navigateBack({
        delta
      })
    },
    switchTab(url) {
      uni.switchTab({
        url
      })
    },
    showToast(title, icon = 'none') {
      uni.showToast({
        title,
        icon
      })
    }
  }
})

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})
app.$mount()

// 无需登录即可访问的白名单页面
const whiteList = [
  'pages/login/index',
  'pages/register/index',
  'pages/forget-password/index'
]

// 验证token函数
function validateToken() {
  if (isTokenExpired()) {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('nutritionGoal')
    uni.removeStorageSync('lastVerifyTime')
    store.commit('user/SET_LOGIN_STATUS', false)
    return false
  }
  return true
}

// 页面跳转拦截
uni.addInterceptor('navigateTo', {
  invoke(params) {
    // 获取要跳转的页面路径（去掉 ? 后面的参数）
    const url = params.url.split('?')[0]
    
    // 检查该页面是否在白名单中
    if (!whiteList.some(page => url.includes(page))) {
      // 验证token
      if (!validateToken()) {
        // token不存在或已过期，跳转到登录页
        uni.navigateTo({
          url: '/pages/login/index'
        })
        return false
      }
    }
    return params
  }
})

// 拦截 switchTab
uni.addInterceptor('switchTab', {
  invoke(params) {
    // 验证token
    if (!validateToken()) {
      uni.navigateTo({
        url: '/pages/login/index'
      })
      return false
    }
    return params
  }
})

// 拦截 reLaunch
uni.addInterceptor('reLaunch', {
  invoke(params) {
    const url = params.url.split('?')[0]
    if (!whiteList.some(page => url.includes(page))) {
      // 验证token
      if (!validateToken()) {
        uni.navigateTo({
          url: '/pages/login/index'
        })
        return false
      }
    }
    return params
  }
})

// 拦截 redirectTo
uni.addInterceptor('redirectTo', {
  invoke(params) {
    const url = params.url.split('?')[0]
    if (!whiteList.some(page => url.includes(page))) {
      // 验证token
      if (!validateToken()) {
        uni.navigateTo({
          url: '/pages/login/index'
        })
        return false
      }
    }
    return params
  }
})
