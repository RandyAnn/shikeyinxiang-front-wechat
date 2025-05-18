<template>
  <view class="profile">
    <!-- 遮罩层和裁剪组件 -->
    <view class="cropper-mask" v-if="showCropper"></view>
    <qf-image-cropper v-if="showCropper" :src="tempImagePath" :width="300" :height="300" :radius="150" @crop="onCropComplete" :zIndex="1000"></qf-image-cropper>
    
    <!-- 模态框组件 -->
    <view class="modal-mask" v-if="showModal"></view>
    <view class="modal-container" v-if="showModal">
      <view class="modal-header">
        <text>修改{{ modalTitle }}</text>
      </view>
      <view class="modal-body">
        <input class="modal-input" v-model="modalInputValue" :placeholder="'请输入' + modalTitle" />
      </view>
      <view class="modal-footer">
        <button class="modal-btn cancel" @click="cancelModal">取消</button>
        <button class="modal-btn confirm" @click="confirmModal">确定</button>
      </view>
    </view>
    
    <!-- 上传遮罩层 -->
    <view class="modal-mask" v-if="showUploadMask"></view>
    
    <!-- 个人信息列表 -->
    <view class="info-list">
      <!-- 头像项 -->
      <view class="info-item" @click="chooseAvatarAndUpload">
        <text class="item-label">头像</text>
        <view class="item-content avatar-wrapper">
          <image class="avatar-small" :src="avatarSource"></image>
          <image class="arrow-icon" src="/static/icons/arrow-right.png"></image>
        </view>
      </view>
      
      <!-- 用户名项 -->
      <view class="info-item" @click="openModal('用户名', username)">
        <text class="item-label">用户名</text>
        <view class="item-content">
          <text class="item-value">{{ username }}</text>
          <image class="arrow-icon" src="/static/icons/arrow-right.png"></image>
        </view>
      </view>
      
      <!-- 邮箱项 -->
      <view class="info-item" @click="openModal('邮箱', email)">
        <text class="item-label">邮箱</text>
        <view class="item-content">
          <text class="item-value">{{ maskedEmail }}</text>
          <image class="arrow-icon" src="/static/icons/arrow-right.png"></image>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { getAvatarUploadUrl, getUserAvatar } from '@/api/user'
import QfImageCropper from '@/components/qf-image-cropper/qf-image-cropper'
import { checkFileExists, downloadAndCacheAvatar } from '@/utils/fileCache'

export default {
  components: {
    QfImageCropper
  },
  data() {
    return {
      userId: '',
      username: '',
      email: '',
      showCropper: false, // 控制裁剪组件的显示
      tempImagePath: '', // 临时图片路径
      croppedImagePath: '', // 裁剪后的图片路径
      showModal: false, // 控制模态框显示
      modalTitle: '', // 模态框标题
      modalInputValue: '', // 模态框输入值
      currentField: '', // 当前编辑的字段
      showUploadMask: false // 控制上传遮罩层显示
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.user.userInfo,
      isLogin: state => state.user.isLogin,
      localAvatarPath: state => state.user.localAvatarPath,
      avatarNeedsUpdate: state => state.user.avatarNeedsUpdate
    }),
    maskedEmail() {
      if (!this.email) return '';
      
      // 找到@符号的位置
      const atIndex = this.email.indexOf('@');
      if (atIndex <= 1) return this.email; // 邮箱格式异常或过短
      
      // 取邮箱的前两个字符和@后面的部分，中间用****替代
      const prefix = this.email.substring(0, 2);
      const suffix = this.email.substring(atIndex);
      
      return prefix + '****' + suffix;
    },
    avatarSource() {
      if (this.localAvatarPath) {
        return this.localAvatarPath;
      }
      return this.userInfo.avatar || '/static/images/default-avatar.png';
    }
  },
  onLoad() {
    // 只初始化数据，不检查头像
    this.initData()
  },
  onShow() {
    // 页面显示时，如果已登录且头像需要更新，检查头像
    if (this.isLogin && this.avatarNeedsUpdate) {
      this.checkLocalAvatar()
    }
  },
  methods: {
    ...mapActions({
      updateUserInfo: 'user/updateUserInfo'
    }),
    initData() {
      // 从 store 中获取数据
      this.userId = this.userInfo.id || ''
      this.username = this.userInfo.username || ''
      this.email = this.userInfo.email || ''
    },
    // 检查本地头像
    async checkLocalAvatar() {
      try {
        // 检查是否有本地缓存的头像
        const hasLocalAvatar = this.localAvatarPath ? 
          await checkFileExists(this.localAvatarPath) : false;
        
        // 如果本地没有缓存或头像需要更新，且有远程头像URL
        if ((!hasLocalAvatar || this.avatarNeedsUpdate) && this.userInfo.avatar) {
          // 下载并缓存头像
          const newLocalPath = await downloadAndCacheAvatar(this.userInfo.avatar);
          this.$store.commit('user/SET_LOCAL_AVATAR_PATH', newLocalPath);
          this.$store.commit('user/SET_AVATAR_UPDATE_STATUS', false);
        }
      } catch (error) {
        console.error('检查或缓存头像失败', error);
      }
    },
    // 打开模态框
    openModal(title, value) {
      this.modalTitle = title
      this.modalInputValue = value
      this.currentField = title === '用户名' ? 'username' : 'email'
      this.showModal = true
    },
    // 取消模态框
    cancelModal() {
      this.showModal = false
    },
    // 确认模态框
    confirmModal() {
      // 根据当前编辑的字段更新数据
      if (this.currentField === 'username') {
        this.username = this.modalInputValue
      } else if (this.currentField === 'email') {
        this.email = this.modalInputValue
      }
      
      // 保存单项修改
      this.saveField(this.currentField, this.modalInputValue)
      
      // 关闭模态框
      this.showModal = false
    },
    // 保存单个字段
    saveField(field, value) {
      // 构建要更新的数据
      const userData = {
        id: this.userId,
        ...this.userInfo
      }
      
      // 更新对应字段
      if (field === 'username') {
        userData.nickname = value
      } else if (field === 'email') {
        userData.email = value
      }
      
      // 调用 store action 更新用户信息
      uni.showLoading({ title: '保存中...' })
      
      this.updateUserInfo(userData)
        .then(() => {
          uni.hideLoading()
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })
        })
        .catch(err => {
          uni.hideLoading()
          uni.showToast({
            title: '保存失败',
            icon: 'none'
          })
          console.error('保存用户信息失败', err)
        })
    },
    async chooseAvatarAndUpload() {
      try {
        // 1. 选择图片
        const { tempFiles } = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1, // 最多选择1张图片
            sizeType: ['compressed'], // 压缩图片
            sourceType: ['album', 'camera'], // 可以从相册或相机选择
            success: resolve,
            fail: (error) => {
              // 检查是否为用户取消操作
              if (error && (error.errMsg === 'chooseImage:fail cancel' || error.errMsg.includes('cancel'))) {
                // 用户取消，不做任何处理，静默返回
                console.log('用户取消了选择图片');
                // 不触发reject，直接返回
                return;
              }
              // 其他错误正常reject
              reject(error);
            }
          })
        })
        
        // 如果没有选择文件，直接返回
        if (!tempFiles || tempFiles.length === 0) {
          return;
        }
        
        const tempFilePath = tempFiles[0].path
        
        // 2. 检查图片大小
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (tempFiles[0].size > maxSize) {
          uni.showToast({
            title: '图片大小不能超过5MB',
            icon: 'none'
          })
          return
        }
        
        // 3. 显示裁剪组件
        this.tempImagePath = tempFilePath
        this.showCropper = true
        
      } catch (error) {
        console.error('选择图片失败', error)
        // 只在非用户取消的情况下显示错误提示
        uni.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    },
    // 裁剪完成回调
    onCropComplete(e) {
      // 获取裁剪后的图片临时路径
      this.croppedImagePath = e.tempFilePath
      // 隐藏裁剪组件
      this.showCropper = false
      // 上传裁剪后的图片
      this.uploadCroppedImage()
    },
    // 上传裁剪后的图片
    async uploadCroppedImage() {
      try {
        if (!this.croppedImagePath) {
          uni.showToast({
            title: '裁剪图片失败',
            icon: 'none'
          })
          return
        }
        
        // 1. 显示上传中的提示和遮罩
        this.showUploadMask = true
        uni.showLoading({
          title: '上传中...'
        })
        
        // 2. 获取图片类型
        const fileType = this.croppedImagePath.substring(this.croppedImagePath.lastIndexOf('.') + 1)
        let contentType
        switch (fileType.toLowerCase()) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg'
            break
          case 'png':
            contentType = 'image/png'
            break
          case 'gif':
            contentType = 'image/gif'
            break
          default:
            contentType = 'image/jpeg' // 裁剪后的图片格式可能不明确，默认使用jpeg
        }
        
        try {
          // 3. 获取预签名上传URL (直接传递contentType作为数据而非查询参数)
          const uploadRes = await getAvatarUploadUrl(contentType)
          const { uploadUrl, fileName } = uploadRes.data
          
          // 4. 使用微信小程序的方式构建二进制上传请求
          const uploadResult = await new Promise((resolve, reject) => {
            // 读取文件为ArrayBuffer
            const fs = uni.getFileSystemManager()
            fs.readFile({
              filePath: this.croppedImagePath,
              position: 0,
              success: function(readRes) {
                // 获取ArrayBuffer数据
                const buffer = readRes.data
                
                // 使用微信原生API直接发送请求
                wx.request({
                  url: uploadUrl,
                  method: 'PUT',
                  data: buffer, // 直接传递二进制数据
                  header: {
                    'Content-Type': contentType // 确保与签名请求中的Content-Type匹配
                  },
                  responseType: 'text',
                  success: function(res) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                      resolve(res)
                    } else {
                      console.error('上传失败状态码:', res.statusCode)
                      console.error('上传失败响应:', res.data)
                      reject(new Error(`上传失败: 状态码 ${res.statusCode}`))
                    }
                  },
                  fail: function(err) {
                    console.error('上传请求失败:', err)
                    reject(new Error('上传请求失败: ' + JSON.stringify(err)))
                  }
                })
              },
              fail: function(err) {
                console.error('读取文件失败:', err)
                reject(new Error('读取文件失败: ' + JSON.stringify(err)))
              }
            })
          })
          
          console.log('上传结果:', uploadResult)
          
          // 5. 获取新的头像URL
          const avatarRes = await getUserAvatar()
          if (avatarRes.data && avatarRes.data.avatarUrl) {
            // 6. 更新用户头像信息
            this.$store.commit('user/SET_USER_INFO', {
              ...this.userInfo,
              avatar: avatarRes.data.avatarUrl
            })
            
            // 立即下载并缓存新头像
            const newLocalPath = await downloadAndCacheAvatar(avatarRes.data.avatarUrl)
            this.$store.commit('user/SET_LOCAL_AVATAR_PATH', newLocalPath)
            
            // 设置头像不需要更新，因为我们已经立即更新了
            this.$store.commit('user/SET_AVATAR_UPDATE_STATUS', false)
            
            // 7. 显示成功提示
            uni.hideLoading()
            uni.showToast({
              title: '头像上传成功',
              icon: 'success'
            })
          } else {
            throw new Error('获取头像URL失败')
          }
        } catch (uploadError) {
          console.error('上传过程出错:', uploadError)
          throw uploadError
        }
      } catch (error) {
        console.error('头像上传失败', error)
        uni.hideLoading()
        uni.showToast({
          title: '头像上传失败',
          icon: 'none'
        })
      } finally {
        // 隐藏遮罩
        this.showUploadMask = false
      }
    }
  }
}
</script>

<style lang="scss">
.profile {
  min-height: 100vh;
  background-color: #f8f8f8;
}

/* 裁剪组件相关样式 */
.cropper-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 999;
}

/* 模态框样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.modal-container {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  background-color: #fff;
  border-radius: 12rpx;
  z-index: 999;
  overflow: hidden;
}

.modal-header {
  padding: 30rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  border-bottom: 1rpx solid #eee;
}

.modal-body {
  padding: 30rpx;
}

.modal-input {
  width: 100%;
  height: 80rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #eee;
}

.modal-btn {
  flex: 1;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  font-size: 32rpx;
  border-radius: 0;
  
  &.cancel {
    color: #999;
    border-right: 1rpx solid #eee;
  }
  
  &.confirm {
    color: #4CAF50;
  }
}

/* 个人信息列表样式 */
.info-list {
  margin-top: 20rpx;
  background-color: #ffffff;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  .item-label {
    font-size: 30rpx;
    color: #333;
  }
  
  .item-content {
    display: flex;
    align-items: center;
    
    .item-value {
      font-size: 28rpx;
      color: #666;
      margin-right: 20rpx;
      
      &.disabled {
        color: #999;
      }
    }
    
    .arrow-icon {
      width: 32rpx;
      height: 32rpx;
    }
  }
  
  .avatar-wrapper {
    display: flex;
    align-items: center;
  }
  
  .avatar-small {
    width: 80rpx;
    height: 80rpx;
    border-radius: 40rpx;
    margin-right: 20rpx;
  }
}
</style> 