<template>
	<view class="dashboard">
		<!-- 顶部安全区域 -->
		<view class="safe-area"></view>

		<!-- 顶部标题和已完成状态 -->
		<view class="header">
			<view class="left-section">
				<text class="title">首页</text>
			</view>
			<view class="center-section">
				<view class="completed-status">
					<text class="progress">已完成 {{ completionRate || 0 }}%</text>
				</view>
			</view>
			<view class="right-section"></view>
		</view>

		<!-- 日期显示 -->
		<view class="date-info">
			<text class="date">{{ currentDate }}</text>
		</view>

		<!-- 营养素圆环 - 2x2布局 -->
		<view class="nutrition-progress-container">
			<view class="progress-row">
				<view class="progress-item">
					<nutrition-circle
						:percentage="nutritionData && nutritionData.caloriePercentage || 0"
						:target="calorieTarget"
						:current="nutritionData && nutritionData.calorie || 0"
						color="#FF7043"
						label="热量"
					/>
				</view>
				<view class="progress-item">
					<nutrition-circle
						:percentage="nutritionData && nutritionData.proteinPercentage || 0"
						:target="userInfo.nutritionGoals && userInfo.nutritionGoals.protein || 88"
						:current="nutritionData && nutritionData.protein || 0"
						color="#5C6BC0"
						label="蛋白质"
					/>
				</view>
			</view>
			<view class="progress-row">
				<view class="progress-item">
					<nutrition-circle
						:percentage="nutritionData && nutritionData.carbsPercentage || 0"
						:target="userInfo.nutritionGoals && userInfo.nutritionGoals.carbs || 300"
						:current="nutritionData && nutritionData.carbs || 0"
						color="#26A69A"
						label="碳水"
					/>
				</view>
				<view class="progress-item">
					<nutrition-circle
						:percentage="nutritionData && nutritionData.fatPercentage || 0"
						:target="userInfo.nutritionGoals && userInfo.nutritionGoals.fat || 70"
						:current="nutritionData && nutritionData.fat || 0"
						color="#EC407A"
						label="脂肪"
					/>
				</view>
			</view>
		</view>

		<!-- 快速入口 -->
		<view class="quick-actions">
			<view class="action-item" @click="navigateTo('/pages/diet-record/add')">
				<view class="action-icon">
					<image src="/static/icons/add-food.png"></image>
				</view>
				<text>记录饮食</text>
			</view>
			<view class="action-item" @click="navigateTo('/pages/health-report/index')">
				<view class="action-icon">
					<image src="/static/icons/analysis.png"></image>
				</view>
				<text>查看报告</text>
			</view>
		</view>

		<!-- 营养建议 -->
		<view class="nutrition-advice">
			<view class="advice-header">
				<text class="advice-title">营养建议</text>
			</view>
			<view class="advice-content">
				<!-- 如果有多条建议，显示列表 -->
				<view v-if="nutritionAdviceList && nutritionAdviceList.length > 0" class="advice-list">
					<view class="advice-item" v-for="(item, index) in nutritionAdviceList" :key="index" :class="item.type">
						<text class="advice-item-title">{{ item.title }}</text>
						<text class="advice-item-desc">{{ item.description }}</text>
					</view>
				</view>
				<!-- 如果没有建议，显示默认文本 -->
				<text v-else>{{ nutritionAdvice }}</text>
			</view>
		</view>


	</view>
</template>

<script>
import NutritionCircle from '@/components/common/NutritionCircle.vue'
import { formatDate } from '@/utils/date.js'
import { mapState, mapActions, mapGetters } from 'vuex'

export default {
	components: {
		NutritionCircle
	},
	data() {
		return {
			currentDate: '',
			// 数据缓存时间戳，用于判断是否需要重新获取数据
			lastDataFetchTime: 0,
			// 缓存刷新间隔，单位为毫秒（默认2分钟，首页可以设置短一些）
			dataCacheTime: 2 * 60 * 1000
		}
	},
	computed: {
		...mapState({
			userInfo: state => state.user.userInfo,
		}),
		...mapGetters({
			nutritionData: 'nutrition/nutritionData',
			nutritionAdviceList: 'nutrition/nutritionAdvice', // 添加营养建议getter
			dataChanged: 'nutrition/dataChanged' // 添加数据变更标志
		}),
		completionRate() {
			const calorieTarget = this.calorieTarget || 1;
			const currentCalorie = this.currentCalorie || 0;
			return Math.round((currentCalorie / calorieTarget) * 100) || 0;
		},
		caloriePercentage() {
			// 优先使用nutritionData中的caloriePercentage，如果有的话
			if (this.nutritionData && this.nutritionData.caloriePercentage !== undefined) {
				return Math.min(this.nutritionData.caloriePercentage || 0, 100);
			}
			// 回退到自己计算的比例
			return Math.min(this.completionRate || 0, 100);
		},
		calorieTarget() {
			return this.userInfo.calorieTarget || 2200
		},
		currentCalorie() {
			return this.nutritionData && this.nutritionData.calorie || 0
		},
		// 获取第一条营养建议的描述，如果没有则显示默认文本
		nutritionAdvice() {
			if (this.nutritionAdviceList && this.nutritionAdviceList.length > 0) {
				return this.nutritionAdviceList[0].description
			}
			return '保持均衡饮食，多吃蔬果，适量运动'
		}
	},
	onLoad() {
		this.currentDate = formatDate(new Date(), 'M月d日')
		const today = formatDate(new Date(), 'yyyy-MM-dd')
		// 同时获取营养数据和营养建议
		this.fetchNutritionData({ date: today })
		this.fetchNutritionAdvice({ date: today })
	},
	// 添加onShow生命周期，当从其他页面返回时更新数据
	onShow() {
		const currentTime = Date.now()
		const timeSinceLastFetch = currentTime - this.lastDataFetchTime

		// 检查是否需要刷新数据：首次加载、缓存过期或数据已变更
		if (this.lastDataFetchTime === 0 || timeSinceLastFetch > this.dataCacheTime || this.dataChanged) {
			// 如果是首次加载、缓存已过期或数据已变更，则重新获取数据
			console.log('首页：刷新数据', this.dataChanged ? '（数据已变更）' : '（缓存过期）')
			this.refreshData()
		} else {
			// 缓存有效，不重新请求数据
			console.log('首页：使用缓存数据，跳过网络请求')
		}
	},
	// 添加下拉刷新处理方法
	onPullDownRefresh() {
		console.log('首页：下拉刷新')
		// 刷新数据
		this.refreshData().then(() => {
			// 停止下拉刷新动画
			uni.stopPullDownRefresh()
			// 显示刷新成功提示
			uni.showToast({
				title: '刷新成功',
				icon: 'success',
				duration: 1000
			})
		})
	},
	methods: {
		...mapActions({
			fetchNutritionData: 'nutrition/fetchNutritionData',
			fetchNutritionAdvice: 'nutrition/fetchNutritionAdvice'
		}),
		// 刷新数据的统一方法
		refreshData() {
			const today = formatDate(new Date(), 'yyyy-MM-dd')
			// 返回Promise以便链式调用
			return Promise.all([
				this.fetchNutritionData({ date: today }),
				this.fetchNutritionAdvice({ date: today })
			])
				.then(() => {
					// 更新数据缓存时间戳
					this.lastDataFetchTime = Date.now()

					// 重置数据变更标志
					if (this.dataChanged) {
						this.$store.dispatch('nutrition/setDataChanged', false)
					}
				})
		},
		navigateTo(url) {
			uni.navigateTo({
				url
			})
		}
	}
}
</script>

<style lang="scss">
.dashboard {
	padding: 0 20rpx 20rpx;
	background-color: #4CAF50;
	background-image: linear-gradient(to bottom, #4CAF50, #43A047);
	min-height: 100vh;
}

.safe-area {
	height: 80rpx; /* 增加顶部安全区域高度 */
	background-color: #4CAF50;
}

.header {
	padding: 0 30rpx;
	display: flex;
	align-items: center;
	height: 88rpx;  /* 与胶囊按钮高度一致 */
	margin-bottom: 10rpx;

	.left-section {
		width: 120rpx;

		.title {
			font-size: 36rpx;
			font-weight: bold;
			color: #ffffff;
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		}
	}

	.center-section {
		flex: 1;
		display: flex;
		justify-content: center;

		.completed-status {
			height: 60rpx;
			padding: 0 20rpx;
			background-color: rgba(255, 255, 255, 0.15);
			border-radius: 30rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);

			.progress {
				font-size: 26rpx;
				color: #ffffff;
				text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
			}
		}
	}

	.right-section {
		width: 120rpx;
	}
}

.date-info {
	padding: 0 30rpx;
	margin-bottom: 15rpx;

	.date {
		font-size: 30rpx;
		color: #ffffff;
		opacity: 0.95;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
	}
}

.nutrition-progress-container {
	margin: 20rpx 0 30rpx;
	padding: 0 20rpx;

	.progress-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 25rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.progress-item {
			width: 48%; /* 每个项目占用行宽的48%，留出间距 */
			background-color: rgba(0, 0, 0, 0.06);
			border-radius: 16rpx;
			padding: 20rpx 0;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		}
	}
}

.quick-actions {
	display: flex;
	justify-content: space-around;
	margin: 40rpx 0;

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: rgba(255, 255, 255, 0.15);
		border-radius: 16rpx;
		padding: 24rpx 15rpx;
		width: 200rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		border: 1rpx solid rgba(255, 255, 255, 0.2);

		.action-icon {
			width: 80rpx;
			height: 80rpx;
			margin-bottom: 15rpx;
			background-color: rgba(255, 255, 255, 0.25);
			border-radius: 50%;
			display: flex;
			justify-content: center;
			align-items: center;
			box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

			image {
				width: 50rpx;
				height: 50rpx;
			}
		}

		text {
			font-size: 28rpx;
			color: #ffffff;
			font-weight: 500;
			text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
		}

		&:active {
			transform: scale(0.96);
			box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.1);
		}
	}
}

.nutrition-advice {
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 25rpx;
	margin-bottom: 30rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);

	.advice-header {
		margin-bottom: 15rpx;
		display: flex;
		align-items: center;

		.advice-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333333;
			position: relative;
			padding-left: 20rpx;

			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 50%;
				transform: translateY(-50%);
				width: 8rpx;
				height: 28rpx;
				background-color: #4CAF50;
				border-radius: 4rpx;
			}
		}
	}

	.advice-content {
		padding: 10rpx 0;

		text {
			font-size: 28rpx;
			color: #666666;
			line-height: 1.6;
		}

		.advice-list {
			.advice-item {
				margin-bottom: 20rpx;
				padding: 15rpx;
				border-radius: 10rpx;
				background-color: #f9f9f9;
				border-left: 4rpx solid #4CAF50;

				&:last-child {
					margin-bottom: 0;
				}

				&.warning {
					border-left-color: #FF9800;
				}

				&.danger {
					border-left-color: #F44336;
				}

				&.success {
					border-left-color: #4CAF50;
				}

				&.info {
					border-left-color: #2196F3;
				}

				.advice-item-title {
					font-size: 28rpx;
					font-weight: bold;
					color: #333333;
					margin-bottom: 8rpx;
					display: block;
				}

				.advice-item-desc {
					font-size: 26rpx;
					color: #666666;
					line-height: 1.5;
				}
			}
		}
	}
}


</style>
