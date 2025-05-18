import request from '@/utils/request';

const state = {
  // 每日营养摄入统计
  nutritionData: {
    date: '',
    calorie: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    caloriePercentage: 0,
    proteinPercentage: 0,
    carbsPercentage: 0,
    fatPercentage: 0
  },
  // 营养趋势数据
  nutritionTrend: {
    dateList: [],
    calorieList: [],
    proteinList: [],
    carbsList: [],
    fatList: []
  },
  // 营养详情列表
  nutritionDetails: [],
  // 营养建议列表
  nutritionAdvice: [],
  // 健康报告数据
  healthReport: {
    healthScore: 0,
    scoreChange: 0,
    nutritionBalance: {
      protein: 0,
      carbs: 0,
      fat: 0,
      vitamins: 0,
      water: 0
    },
    achievements: [],
    weeklyProgress: {
      calorie: { lastWeek: 0, thisWeek: 0 },
      protein: { lastWeek: 0, thisWeek: 0 },
      carbs: { lastWeek: 0, thisWeek: 0 },
      fat: { lastWeek: 0, thisWeek: 0 }
    }
  },
  // 加载状态
  loading: false,
  // 数据变更标志，用于通知页面数据已发生变化
  dataChanged: false
};

const mutations = {
  SET_NUTRITION_DATA(state, data) {
    state.nutritionData = data;
  },
  SET_NUTRITION_TREND(state, data) {
    state.nutritionTrend = data;
  },
  SET_NUTRITION_DETAILS(state, data) {
    state.nutritionDetails = data;
  },
  SET_NUTRITION_ADVICE(state, data) {
    state.nutritionAdvice = data;
  },
  SET_HEALTH_REPORT(state, data) {
    state.healthReport = data;
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_DATA_CHANGED(state, status) {
    state.dataChanged = status;
  }
};

const actions = {
  /**
   * 获取营养数据
   * @param {Object} context - Vuex上下文
   * @param {Object} params - 查询参数
   * @param {string} [params.date] - 日期，格式：YYYY-MM-DD
   */
  async fetchNutritionData({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      // 构建请求参数
      const queryParams = {};
      if (params.date) {
        queryParams.date = params.date;
      }
      
      // 调用后端API
      const response = await request({
        url: '/api/nutrition/daily',
        method: 'GET',
        data: queryParams
      });
      
      if (response.code === 200) {
        commit('SET_NUTRITION_DATA', response.data);
      }
      
      return response;
    } catch (error) {
      console.error('获取营养数据失败', error);
      return Promise.reject(error);
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  /**
   * 获取营养趋势数据
   * @param {Object} context - Vuex上下文
   * @param {Object} params - 查询参数
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @param {string} [params.type] - 类型：week、month、custom
   */
  async fetchNutritionTrend({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      // 构建请求参数
      const queryParams = {};
      if (params.startDate) {
        queryParams.startDate = params.startDate;
      }
      if (params.endDate) {
        queryParams.endDate = params.endDate;
      }
      if (params.type) {
        queryParams.type = params.type;
      }
      
      // 调用后端API
      const response = await request({
        url: '/api/nutrition/trend',
        method: 'GET',
        data: queryParams
      });
      
      if (response.code === 200) {
        commit('SET_NUTRITION_TREND', response.data);
      }
      
      return response;
    } catch (error) {
      console.error('获取营养趋势数据失败', error);
      return Promise.reject(error);
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  /**
   * 获取营养详情数据
   * @param {Object} context - Vuex上下文
   * @param {Object} params - 查询参数
   * @param {string} [params.date] - 日期，格式：YYYY-MM-DD
   */
  async fetchNutritionDetails({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      // 构建请求参数
      const queryParams = {};
      if (params.date) {
        queryParams.date = params.date;
      }
      
      // 调用后端API
      const response = await request({
        url: '/api/nutrition/details',
        method: 'GET',
        data: queryParams
      });
      
      if (response.code === 200) {
        commit('SET_NUTRITION_DETAILS', response.data);
      }
      
      return response;
    } catch (error) {
      console.error('获取营养详情数据失败', error);
      return Promise.reject(error);
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  /**
   * 获取营养建议
   * @param {Object} context - Vuex上下文
   * @param {Object} params - 查询参数
   * @param {string} [params.date] - 日期，格式：YYYY-MM-DD
   */
  async fetchNutritionAdvice({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      // 构建请求参数
      const queryParams = {};
      if (params.date) {
        queryParams.date = params.date;
      }
      
      // 调用后端API
      const response = await request({
        url: '/api/nutrition/advice',
        method: 'GET',
        data: queryParams
      });
      
      if (response.code === 200) {
        commit('SET_NUTRITION_ADVICE', response.data);
      }
      
      return response;
    } catch (error) {
      console.error('获取营养建议失败', error);
      return Promise.reject(error);
    } finally {
      commit('SET_LOADING', false);
    }
  },

  /**
   * 获取健康报告
   * @param {Object} context - Vuex上下文
   * @param {Object} params - 查询参数
   * @param {string} [params.date] - 日期，格式：YYYY-MM-DD
   */
  async fetchHealthReport({ commit }, params = {}) {
    commit('SET_LOADING', true);
    try {
      // 构建请求参数
      const queryParams = {};
      if (params.date) {
        queryParams.date = params.date;
      }
      
      // 调用后端API
      const response = await request({
        url: '/api/health/report',
        method: 'GET',
        data: queryParams
      });
      
      if (response.code === 200) {
        commit('SET_HEALTH_REPORT', response.data);
      }
      
      return response;
    } catch (error) {
      console.error('获取健康报告失败', error);
      return Promise.reject(error);
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  /**
   * 设置数据变更标志
   * @param {Object} context - Vuex上下文
   * @param {boolean} status - 标志状态
   */
  setDataChanged({ commit }, status) {
    commit('SET_DATA_CHANGED', status);
  }
};

const getters = {
  nutritionData: state => state.nutritionData,
  nutritionTrend: state => state.nutritionTrend,
  nutritionDetails: state => state.nutritionDetails,
  nutritionAdvice: state => state.nutritionAdvice,
  healthReport: state => state.healthReport,
  isLoading: state => state.loading,
  dataChanged: state => state.dataChanged
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}; 