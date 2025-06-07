import store from '@/store'

// 基础URL
// const baseURL = 'http://192.168.157.189:8084'
const baseURL = 'http://192.168.202.223:8084'
// const baseURL = 'http://localhost:8084'

// 自定义base64解码函数，兼容不同环境
function base64Decode(str) {
  // 处理base64字符串，将URL安全的字符转换回来
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  
  try {
    // 尝试使用微信提供的方法
    if (uni.arrayBufferToBase64 && uni.base64ToArrayBuffer) {
      const arrayBuffer = uni.base64ToArrayBuffer(base64)
      return String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))
    }
    
    // 如果可以直接使用atob
    if (typeof atob === 'function') {
      return atob(base64)
    }
    
    // 手动实现base64解码
    let decodedString = ''
    const input = base64.replace(/=+$/, '')
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    
    for (let i = 0; i < input.length; i += 4) {
      const enc1 = chars.indexOf(input.charAt(i))
      const enc2 = chars.indexOf(input.charAt(i + 1))
      const enc3 = chars.indexOf(input.charAt(i + 2))
      const enc4 = chars.indexOf(input.charAt(i + 3))
      
      const char1 = (enc1 << 2) | (enc2 >> 4)
      const char2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      const char3 = ((enc3 & 3) << 6) | enc4
      
      decodedString += String.fromCharCode(char1)
      if (enc3 !== 64) decodedString += String.fromCharCode(char2)
      if (enc4 !== 64) decodedString += String.fromCharCode(char3)
    }
    
    return decodedString
  } catch (e) {
    console.error('Base64解码失败', e)
    throw e
  }
}

// 检查token是否过期
export const isTokenExpired = () => {
  const token = uni.getStorageSync('token')
  if (!token) {
    return true
  }
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return true
    }
    
    const payload = parts[1]
    if (!payload) {
      return true
    }
    
    try {
      const decodedText = base64Decode(payload)
      const decodedPayload = JSON.parse(decodedText)
      
      if (decodedPayload.exp) {
        const expiryTime = decodedPayload.exp * 1000
        const currentTime = Date.now()
        
        if (expiryTime < currentTime) {
          return true
        }
      } else {
        return true
      }
      
      return false
    } catch (decodeError) {
      return true
    }
  } catch (e) {
    return true
  }
}

// 处理token过期
export const handleTokenExpired = () => {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('nutritionGoal')
  uni.removeStorageSync('lastVerifyTime')
  store.commit('user/SET_LOGIN_STATUS', false)
  
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const currentPath = currentPage ? currentPage.route : ''
  
  const whiteList = ['pages/login/index', 'pages/register/index', 'pages/forget-password/index']
  if (!whiteList.some(page => currentPath.includes(page))) {
    uni.reLaunch({
      url: '/pages/login/index'
    })
  }
}

// 请求方法
const request = (options) => {
  const isLoginRequest = options.url.includes('/api/auth/user/login') || 
                          options.url.includes('/api/auth/wechat-login') || 
                          options.url.includes('/auth/register') || 
                          options.url.includes('/auth/reset-password');
  
  if (!isLoginRequest) {
    if (isTokenExpired()) {
      handleTokenExpired()
      return Promise.reject({
        message: 'token已过期，请重新登录',
        code: 401
      })
    }
  }

  const token = uni.getStorageSync('token')
  const url = baseURL + options.url

  return new Promise((resolve, reject) => {
    uni.request({
      url: url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data)
          } else {
            uni.showToast({
              title: res.data.message || '请求失败',
              icon: 'none'
            })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          if (!isLoginRequest) {
            handleTokenExpired()
          }
          reject({
            message: res.data.message || '请重新登录',
            code: res.statusCode
          })
        } else if (res.statusCode === 403) {
          uni.showToast({
            title: res.data.message || '账号权限异常',
            icon: 'none'
          })
          reject({
            message: res.data.message || '账号权限异常',
            code: res.statusCode
          })
        } else {
          uni.showToast({
            title: '服务器异常',
            icon: 'none'
          })
          reject({ message: '服务器异常' })
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

export default request