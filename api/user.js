import request from '@/utils/request'

// 登录
export function login(data) {
  return request({
    url: '/api/auth/user/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}

// 更新用户信息
export function updateUserInfo(data) {
  return request({
    url: '/user/update',
    method: 'put',
    data
  })
}

// 更新用户头像
export function updateUserAvatar(data) {
  return request({
    url: '/user/avatar',
    method: 'put',
    data
  })
}

// 获取用户的健康数据
export function getUserHealthData() {
  return request({
    url: '/user/health-data',
    method: 'get'
  })
}

// 更新用户健康目标
export function updateHealthGoal(data) {
  return request({
    url: '/user/health-goal',
    method: 'put',
    data
  })
}

// 更新用户目标
export function updateUserGoal(data) {
  return request({
    url: '/user/goal',
    method: 'put',
    data
  })
}

// 获取用户设置
export function getUserSettings() {
  return request({
    url: '/user/settings',
    method: 'get'
  })
}

// 更新用户设置
export function updateUserSettings(data) {
  return request({
    url: '/user/settings',
    method: 'put',
    data
  })
}

// 获取用户营养目标
export function getNutritionGoal() {
  return request({
    url: '/user/nutrition-goal',
    method: 'get'
  })
}

// 更新用户营养目标
export function updateNutritionGoal(data) {
  return request({
    url: '/user/nutrition-goal',
    method: 'put',
    data
  })
}

// 生成头像上传URL
export function getAvatarUploadUrl(contentType) {
  return request({
    url: `/user/avatar/upload-url?contentType=${encodeURIComponent(contentType)}`,
    method: 'post'
  })
}

// 获取用户头像URL
export function getUserAvatar() {
  return request({
    url: '/user/avatar',
    method: 'get'
  })
}