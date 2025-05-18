<script>
import { mapActions } from 'vuex'
import { isTokenExpired } from '@/utils/request'

export default {
	data() {
		return {
			lastCheckTime: 0 // 记录上次检查时间
		}
	},
	onLaunch: function() {
		console.log('App Launch')
		// 记录检查时间并执行
		this.lastCheckTime = Date.now()
		this.checkLoginAndRedirect()
	},
	onShow: function() {
		console.log('App Show')
		// 判断距离上次检查时间，如果小于2秒则不执行
		const now = Date.now()
		if (now - this.lastCheckTime < 2000) {
			console.log('短时间内重复进入应用，跳过登录检查')
			return
		}
		
		// 记录检查时间并执行
		this.lastCheckTime = now
		this.checkLoginAndRedirect()
	},
	onHide: function() {
		console.log('App Hide')
	},
	methods: {
		...mapActions({
			getUserInfo: 'user/getUserInfo',
			checkLoginStatus: 'user/checkLoginStatus'
		}),
		checkLoginAndRedirect() {
			// 获取当前页面路径
			const pages = getCurrentPages()
			const currentPage = pages[pages.length - 1]
			const currentPath = currentPage ? currentPage.route : ''
			
			// 白名单检查
			const whiteList = ['pages/login/index', 'pages/register/index', 'pages/forget-password/index']
			if (whiteList.some(page => currentPath.includes(page))) {
				return
			}
			
			// 判断token是否存在并检查是否过期
			const token = uni.getStorageSync('token')
			if (!token) {
				// 未登录，直接跳转
				uni.reLaunch({
					url: '/pages/login/index'
				})
				return
			}
			
			// 使用统一的token验证函数检查token是否有效
			if (isTokenExpired()) {
				// token已过期，清除存储
				uni.removeStorageSync('token')
				uni.removeStorageSync('userInfo')
				uni.removeStorageSync('nutritionGoal')
				uni.removeStorageSync('lastVerifyTime')
				
				// 更新状态
				this.$store.commit('user/SET_LOGIN_STATUS', false)
				
				// 跳转到登录页
				uni.reLaunch({
					url: '/pages/login/index'
				})
				return
			}
			
			// 如果token有效，可以异步获取用户信息
			this.getUserInfo().catch(error => {
				console.error('获取用户信息失败', error)
			})
		}
	}
}
</script>

<style lang="scss">
/* 全局样式 */
page {
	font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
	font-size: 28rpx;
	line-height: 1.5;
	color: #333;
	background-color: #f8f8f8;
	/* 安全区域自适应 */
	padding-bottom: constant(safe-area-inset-bottom); /* iOS 11.0 */
	padding-bottom: env(safe-area-inset-bottom); /* iOS 11.2+ */
}

/* 胶囊按钮区域样式 */
.status-bar {
	height: var(--status-bar-height, 20px);
	width: 100%;
}

.capsule-area {
	height: 44px;
	width: 100%;
	position: relative;
}

/* 底部安全区域适配 */
.safe-bottom {
	padding-bottom: constant(safe-area-inset-bottom); /* iOS 11.0 */
	padding-bottom: env(safe-area-inset-bottom); /* iOS 11.2+ */
}

/* 顶部安全区域适配 */
.safe-top {
	padding-top: constant(safe-area-inset-top); /* iOS 11.0 */
	padding-top: env(safe-area-inset-top); /* iOS 11.2+ */
}

/* 清除默认样式 */
view, text, navigator, input, textarea, button {
	box-sizing: border-box;
}

/* 通用样式 */
.container {
	padding: 20rpx;
}

.flex-row {
	display: flex;
	flex-direction: row;
}

.flex-column {
	display: flex;
	flex-direction: column;
}

.flex-center {
	display: flex;
	justify-content: center;
	align-items: center;
}

.flex-between {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.flex-around {
	display: flex;
	justify-content: space-around;
	align-items: center;
}

.flex-1 {
	flex: 1;
}

/* 颜色 */
.primary-color {
	color: #4CAF50;
}

.primary-bg {
	background-color: #4CAF50;
}

.text-white {
	color: #ffffff;
}

.text-gray {
	color: #999999;
}

/* 边距 */
.mt-10 {
	margin-top: 10rpx;
}

.mt-20 {
	margin-top: 20rpx;
}

.mb-10 {
	margin-bottom: 10rpx;
}

.mb-20 {
	margin-bottom: 20rpx;
}

.ml-10 {
	margin-left: 10rpx;
}

.mr-10 {
	margin-right: 10rpx;
}

.p-20 {
	padding: 20rpx;
}

/* 卡片样式 */
.card {
	background-color: #ffffff;
	border-radius: 10rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn {
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 20rpx 30rpx;
	border-radius: 10rpx;
	font-size: 30rpx;
}

.btn-primary {
	background-color: #4CAF50;
	color: #ffffff;
}

.btn-outline {
	border: 1rpx solid #4CAF50;
	color: #4CAF50;
}
</style>
