import {
	login,
	getUserInfo,
	updateUserInfo,
	getNutritionGoal,
	updateNutritionGoal
} from '@/api/user';
import {
	wechatLogin,
	logout as logoutApi
} from '@/api/auth';
import { isTokenExpired } from '@/utils/request';

const state = {
	userInfo: {
		id: '',
		nickname: '',
		avatar: '',
		gender: '',
		height: 0,
		weight: 0,
		targetWeight: 0,
		calorieTarget: 2200
	},
	nutritionGoals: {
		protein: 65,
		carbs: 300,
		fat: 70
	},
	dietPreferences: [
		{ name: '素食', selected: false },
		{ name: '低碳水', selected: false },
		{ name: '高蛋白', selected: false },
		{ name: '无麸质', selected: false },
		{ name: '低钠', selected: false }
	],
	// 用户登录状态
	isLogin: false,
	loading: false,
	localAvatarPath: '', // 本地头像缓存路径
	avatarNeedsUpdate: true // 头像是否需要更新
};

const mutations = {
	SET_USER_INFO(state, userInfo) {
		state.userInfo = userInfo;
	},
	SET_NUTRITION_GOALS(state, goals) {
		state.nutritionGoals = goals;
	},
	SET_DIET_PREFERENCES(state, preferences) {
		state.dietPreferences = preferences.map(item => {
			return {
				name: item.name,
				selected: item.selected || false
			};
		});
	},
	SET_LOGIN_STATUS(state, status) {
		state.isLogin = status;
	},
	SET_LOADING(state, status) {
		state.loading = status;
	},
	// 新增：设置本地头像路径
	SET_LOCAL_AVATAR_PATH(state, path) {
		state.localAvatarPath = path;
	},
	// 新增：设置头像更新状态
	SET_AVATAR_UPDATE_STATUS(state, status) {
		state.avatarNeedsUpdate = status;
	}
};

const actions = {
	// 邮箱登录
	async login({
		commit
	}, {
		email,
		password
	}) {
		commit('SET_LOADING', true);
		try {
			const response = await login({
				email,
				password
			});

			// 保存 token
			uni.setStorageSync('token', response.data.token);
			// 保存 userInfo
			uni.setStorageSync('userInfo', response.data.userInfo);

			// 更新状态
			commit('SET_USER_INFO', response.data.userInfo);
			commit('SET_LOGIN_STATUS', true);

			return response;
		} catch (error) {
			console.error('登录失败', error);
			return Promise.reject(error);
		} finally {
			commit('SET_LOADING', false);
		}
	},

	// 微信登录
	async wechatLogin({
		commit
	}, {
		code,
		encryptedData,
		iv
	}) {
		commit('SET_LOADING', true);
		try {
			const response = await wechatLogin({
				code,
				encryptedData,
				iv
			});

			// 保存 token
			uni.setStorageSync('token', response.data.token);
			// 保存 userInfo
			uni.setStorageSync('userInfo', response.data.userInfo);

			// 更新状态
			commit('SET_USER_INFO', response.data.userInfo);
			commit('SET_LOGIN_STATUS', true);

			return response;
		} catch (error) {
			console.error('微信登录失败', error);
			return Promise.reject(error);
		} finally {
			commit('SET_LOADING', false);
		}
	},

	// 获取用户信息
	async getUserInfo({
		commit
	}) {
		commit('SET_LOADING', true);
		try {
			const response = await getUserInfo();

			// 更新状态并保存到本地
			commit('SET_USER_INFO', response.data);
			commit('SET_LOGIN_STATUS', true);
			uni.setStorageSync('userInfo', response.data);

			return response;
		} catch (error) {
			console.error('获取用户信息失败', error);
			return Promise.reject(error);
		} finally {
			commit('SET_LOADING', false);
		}
	},

	// 获取用户营养目标
	async getNutritionGoal({
		commit
	}) {
		commit('SET_LOADING', true);
		try {
			const response = await getNutritionGoal();

			// 提取营养目标数据
			const nutritionGoal = response.data;

			// 更新状态
			commit('SET_NUTRITION_GOALS', {
				protein: nutritionGoal.proteinTarget,
				carbs: nutritionGoal.carbsTarget,
				fat: nutritionGoal.fatTarget
			});

			// 更新用户信息中的卡路里目标和体重目标
			commit('SET_USER_INFO', {
				...state.userInfo,
				calorieTarget: nutritionGoal.calorieTarget,
				targetWeight: nutritionGoal.weightTarget
			});

			// 更新饮食偏好
			const dietPreferences = [
				{ name: '素食', selected: nutritionGoal.isVegetarian },
				{ name: '低碳水', selected: nutritionGoal.isLowCarb },
				{ name: '高蛋白', selected: nutritionGoal.isHighProtein },
				{ name: '无麸质', selected: nutritionGoal.isGlutenFree },
				{ name: '低钠', selected: nutritionGoal.isLowSodium }
			];
			commit('SET_DIET_PREFERENCES', dietPreferences);

			// 保存到本地存储
			uni.setStorageSync('nutritionGoal', nutritionGoal);

			return response;
		} catch (error) {
			console.error('获取用户营养目标失败', error);
			return Promise.reject(error);
		} finally {
			commit('SET_LOADING', false);
		}
	},

	// 更新用户信息
	async updateUserInfo({
		commit
	}, data) {
		commit('SET_LOADING', true);
		try {
			const response = await updateUserInfo(data);

			// 更新状态并保存到本地
			commit('SET_USER_INFO', response.data);
			uni.setStorageSync('userInfo', response.data);

			return response;
		} catch (error) {
			console.error('更新用户信息失败', error);
			return Promise.reject(error);
		} finally {
			commit('SET_LOADING', false);
		}
	},

	// 更新用户营养目标
	async updateNutritionGoal({
		commit
	}, data) {
		commit('SET_LOADING', true);
		try {
			// 准备请求数据
			const nutritionGoalData = {
				calorieTarget: data.calorieTarget,
				weightTarget: data.weightTarget,
				proteinTarget: data.nutritionGoals.protein,
				carbsTarget: data.nutritionGoals.carbs,
				fatTarget: data.nutritionGoals.fat,
				isVegetarian: data.dietPreferences[0].selected,
				isLowCarb: data.dietPreferences[1].selected,
				isHighProtein: data.dietPreferences[2].selected,
				isGlutenFree: data.dietPreferences[3].selected,
				isLowSodium: data.dietPreferences[4].selected
			};

			const response = await updateNutritionGoal(nutritionGoalData);

			// 更新状态
			commit('SET_NUTRITION_GOALS', {
				protein: nutritionGoalData.proteinTarget,
				carbs: nutritionGoalData.carbsTarget,
				fat: nutritionGoalData.fatTarget
			});

			// 更新用户信息中的卡路里目标和体重目标
			commit('SET_USER_INFO', {
				...state.userInfo,
				calorieTarget: nutritionGoalData.calorieTarget,
				targetWeight: nutritionGoalData.weightTarget
			});

			// 更新饮食偏好
			commit('SET_DIET_PREFERENCES', data.dietPreferences);

			return response;
		} catch (error) {
			console.error('更新用户营养目标失败', error);
			return Promise.reject(error);
		} finally {
			commit('SET_LOADING', false);
		}
	},

	// 退出登录时，调用后端接口并清除本地存储
	async logout({
		commit
	}) {
		try {
			// 获取token，确保在清除前调用后端接口
			const token = uni.getStorageSync('token');
			if (token) {
				// 调用后端logout接口，将token加入黑名单
				await logoutApi();
				console.log('后端登出成功，token已加入黑名单');
			}
		} catch (error) {
			console.error('调用登出接口失败', error);
		} finally {
			// 无论接口调用成功与否，都清除本地存储
			uni.removeStorageSync('token');
			uni.removeStorageSync('userInfo');
			uni.removeStorageSync('nutritionGoal');
			commit('SET_LOGIN_STATUS', false);
			commit('SET_USER_INFO', {});
			commit('SET_AVATAR_UPDATE_STATUS', true);
			// 清除本地头像路径
			commit('SET_LOCAL_AVATAR_PATH', '');

			uni.reLaunch({
				url: '/pages/login/index'
			});
		}
	},


	// 检查登录状态
	checkLoginStatus({ commit, dispatch }) {
		const token = uni.getStorageSync('token')
		if (!token) {
			commit('SET_LOGIN_STATUS', false)
			return Promise.resolve(false)
		}

		// 使用统一的token验证函数
		if (isTokenExpired()) {
			// token已过期，清除存储
			uni.removeStorageSync('token')
			uni.removeStorageSync('userInfo')
			uni.removeStorageSync('nutritionGoal')
			commit('SET_LOGIN_STATUS', false)
			return Promise.resolve(false)
		}

		// token有效，优先使用本地缓存数据
		const storedUserInfo = uni.getStorageSync('userInfo')
		if (storedUserInfo) {
			commit('SET_USER_INFO', storedUserInfo)
			commit('SET_LOGIN_STATUS', true)

			// 异步更新数据，但不影响结果返回
			dispatch('getUserInfo').catch(error => {
				console.log('更新用户数据失败', error)
			})

			return Promise.resolve(true)
		} else {
			// 无本地缓存，需要获取用户信息
			return dispatch('getUserInfo')
				.then(() => {
					commit('SET_LOGIN_STATUS', true)
					return true
				})
				.catch(() => {
					// API获取失败，可能是token无效
					uni.removeStorageSync('token')
					commit('SET_LOGIN_STATUS', false)
					return false
				})
		}
	}
};

export default {
	namespaced: true,
	state,
	mutations,
	actions
};