import {
  addDietRecord,
  getDietRecords,
  getDietRecordDetail,
  deleteDietRecord
} from '@/api/diet'
import { formatDate } from '@/utils/date'
// 添加store引用，用于访问nutrition模块
import store from '@/store'

const state = {
  dietRecords: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  }, // 饮食记录列表（按餐次分组）
  total: 0, // 总条数
  page: 1, // 当前页码
  size: 10, // 每页大小
  hasMore: true, // 是否有更多数据
  loading: false, // 加载状态
  currentRecord: null // 当前选中的记录
}

const mutations = {
  // 设置饮食记录列表
  SET_DIET_RECORDS(state, { records, isFirstPage }) {
    // 支持两种情况：
    // 1. records是按mealType分组的对象 - 前端预处理的情况
    // 2. records是记录数组 - API返回的原始数据

    // 检查records是否为数组，如果是，则需要转换为按餐次分组的对象
    if (Array.isArray(records)) {
      const mealTypeGroups = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      }

      // 处理API返回的数据
      records.forEach(record => {
        const { mealType, foods } = record

        // 确保该餐次数组已初始化
        if (!mealTypeGroups[mealType]) {
          mealTypeGroups[mealType] = []
        }

        // 将食物项添加到对应餐次
        foods.forEach(food => {
          mealTypeGroups[mealType].push({
            id: food.foodId,
            name: food.name,
            desc: `${food.amount} ${food.unit}`,
            calorie: food.calories,
            protein: food.protein,
            fat: food.fat,
            carbs: food.carbs,
            amount: food.amount,
            unit: food.unit,
            recordId: record.id // 保存记录ID，便于后续编辑
          })
        })
      })

      // 更新状态
      state.dietRecords = isFirstPage ? mealTypeGroups : {
        breakfast: [...state.dietRecords.breakfast, ...(mealTypeGroups.breakfast || [])],
        lunch: [...state.dietRecords.lunch, ...(mealTypeGroups.lunch || [])],
        dinner: [...state.dietRecords.dinner, ...(mealTypeGroups.dinner || [])],
        snacks: [...state.dietRecords.snacks, ...(mealTypeGroups.snacks || [])]
      }
    } else {
      // 如果是第一页，直接替换；否则追加
      state.dietRecords = isFirstPage ? records : {
        breakfast: [...state.dietRecords.breakfast, ...(records.breakfast || [])],
        lunch: [...state.dietRecords.lunch, ...(records.lunch || [])],
        dinner: [...state.dietRecords.dinner, ...(records.dinner || [])],
        snacks: [...state.dietRecords.snacks, ...(records.snacks || [])]
      }
    }
  },

  // 设置分页信息
  SET_PAGINATION(state, { total, page, size }) {
    state.total = total
    state.page = page
    state.size = size
    // 计算是否有更多数据
    state.hasMore = state.dietRecords.breakfast.length + state.dietRecords.lunch.length + state.dietRecords.dinner.length + state.dietRecords.snacks.length < total
  },

  // 设置加载状态
  SET_LOADING(state, status) {
    state.loading = status
  },

  // 设置当前选中的记录
  SET_CURRENT_RECORD(state, record) {
    state.currentRecord = record
  },

  // 重置状态
  RESET_STATE(state, { keepOldData = false } = {}) {
    if (!keepOldData) {
      state.dietRecords = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: []
      }
    }
    state.page = 1
    state.hasMore = true
  }
}

const actions = {
  /**
   * 添加饮食记录
   * @param {Object} context - Vuex上下文
   * @param {Object} recordData - 记录数据
   */
  async addDietRecord({ commit, dispatch }, recordData) {
    try {
      const response = await addDietRecord(recordData)

      if (response.code === 200) {
        // 设置营养数据变更标志，通知所有相关页面刷新数据
        dispatch('nutrition/setDataChanged', true, { root: true })

        // 显示添加成功提示
        uni.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1500
        })

        // 延迟返回，给用户时间看到成功提示
        return new Promise(resolve => {
          setTimeout(() => {
            // 返回上一页
            uni.navigateBack({
              delta: 1
            })
            resolve(response.data)
          }, 1500)
        })
      }

      return null
    } catch (error) {
      console.error('添加饮食记录失败', error)
      uni.showToast({
        title: error.message || '添加失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return Promise.reject(error)
    }
  },


  /**
   * 获取饮食记录列表
   * @param {Object} context - Vuex上下文
   * @param {Object} params - 查询参数
   * @param {string} [params.startDate] - 开始日期
   * @param {string} [params.endDate] - 结束日期
   * @param {string} [params.date] - 单一日期（如果提供，将覆盖startDate和endDate）
   * @param {string} [params.mealType] - 餐次类型
   * @param {boolean} [params.reset=false] - 是否重置列表
   */
  async getDietRecords({ commit, state }, { startDate = '', endDate = '', date = '', mealType = '', reset = false }) {
    // 如果正在加载或没有更多数据，直接返回
    if (state.loading || (!state.hasMore && !reset)) {
      return
    }

    // 设置加载状态
    commit('SET_LOADING', true)

    try {
      // 当需要重置或是第一页时，重置状态，但保留旧数据
      if (reset) {
        commit('RESET_STATE', { keepOldData: true })
      }

      // 构造请求参数
      const params = {
        mealType,
        page: reset ? 1 : state.page,
        size: state.size
      }

      // 如果提供了单一日期，则将其同时设置为开始日期和结束日期
      if (date) {
        params.startDate = date
        params.endDate = date
      } else {
        // 否则使用提供的日期范围
        if (startDate) params.startDate = startDate
        if (endDate) params.endDate = endDate
      }

      // 调用API
      const response = await getDietRecords(params)

      if (response.code === 200) {
        const { records, total } = response.data

        // 更新记录列表
        commit('SET_DIET_RECORDS', {
          records,
          isFirstPage: params.page === 1
        })

        // 更新分页信息
        commit('SET_PAGINATION', {
          total,
          page: params.page + 1, // 自动增加页码
          size: state.size
        })
      }

      return response
    } catch (error) {
      console.error('获取饮食记录列表失败', error)
      return Promise.reject(error)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * 获取饮食记录详情
   * @param {Object} context - Vuex上下文
   * @param {number} id - 记录ID
   */
  async getDietRecordDetail({ commit }, id) {
    try {
      const response = await getDietRecordDetail(id)

      if (response.code === 200) {
        commit('SET_CURRENT_RECORD', response.data)
        return response.data
      }

      return null
    } catch (error) {
      console.error('获取饮食记录详情失败', error)
      return Promise.reject(error)
    }
  },

  /**
   * 删除饮食记录
   * @param {Object} context - Vuex上下文
   * @param {number} id - 记录ID
   */
  async deleteDietRecord({ commit }, id) {
    try {
      const response = await deleteDietRecord(id)

      return response.code === 200
    } catch (error) {
      console.error('删除饮食记录失败', error)
      return Promise.reject(error)
    }
  }
}

const getters = {
  // 是否还有更多数据
  hasMoreRecords: state => state.hasMore,

  // 是否正在加载
  isLoading: state => state.loading,

  // 获取当前记录
  currentRecord: state => state.currentRecord,

  // 获取今日总卡路里
  todayCalorie: state => {
    // 1. 优先从nutrition模块获取数据 (如果已加载)
    const nutritionData = store.state.nutrition?.nutritionData
    if (nutritionData && nutritionData.calorie) {
      return nutritionData.calorie
    }

    // 2. 如果nutrition模块数据不可用，则从饮食记录中计算
    let totalCalorie = 0

    if (Array.isArray(state.dietRecords)) {
      // 如果dietRecords是数组形式 (API原始返回格式)
      state.dietRecords.forEach(record => {
        totalCalorie += record.totalCalorie || 0
      })
    } else {
      // 如果dietRecords按餐次分组
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        if (Array.isArray(state.dietRecords[mealType])) {
          state.dietRecords[mealType].forEach(food => {
            totalCalorie += food.calorie || 0
          })
        }
      })
    }

    return totalCalorie
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}