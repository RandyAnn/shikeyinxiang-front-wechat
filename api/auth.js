import request from '@/utils/request'

// 微信登录接口
export function wechatLogin(data) {
  return request({
    url: '/api/auth/wechat-login',
    method: 'post',
    data
  })
}

// 用户注册接口
export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

// 重置密码接口
export function resetPassword(data) {
  return request({
    url: '/auth/reset-password',
    method: 'post',
    data
  })
}

// 退出登录接口
export function logout() {
  return request({
    url: '/api/auth/logout',
    method: 'post'
  })
}