import {
  getFoodList,
  getFoodCategories,
  getFoodDetail
} from '@/api/food'

const state = {
  foodList: [], // 食物列表
  foodCategories: [], // 食物分类
  total: 0, // 总条数
  current: 1, // 当前页码
  size: 10, // 每页大小
  hasMore: true, // 是否有更多数据
  loading: false, // 加载状态
  currentFood: null // 当前选中的食物
}

const mutations = {
  // 设置食物列表
  SET_FOOD_LIST(state, { records, isFirstPage }) {
    // 如果是第一页，直接替换；否则追加
    state.foodList = isFirstPage ? records : [...state.foodList, ...records]
  },

  // 设置食物分类
  SET_FOOD_CATEGORIES(state, categories) {
    state.foodCategories = categories
  },

  // 设置分页信息
  SET_PAGINATION(state, { total, current, size }) {
    state.total = total
    state.current = current
    state.size = size
    // 计算是否有更多数据
    state.hasMore = state.foodList.length < total
  },

  // 设置加载状态
  SET_LOADING(state, status) {
    state.loading = status
  },

  // 设置当前选中的食物
  SET_CURRENT_FOOD(state, food) {
    state.currentFood = food
  },

  // 重置状态
  RESET_STATE(state) {
    state.foodList = []
    state.current = 1
    state.hasMore = true
  }
}

const actions = {
  /**
   * 获取食物列表
   * @param {Object} context - Vuex上下文
   * @param {Object} params - 查询参数
   * @param {string} [params.keyword] - 搜索关键词
   * @param {number} [params.categoryId] - 分类ID
   * @param {boolean} [params.reset=false] - 是否重置列表
   */
  async getFoodList({ commit, state }, { keyword = '', categoryId = undefined, reset = false }) {
    // 如果正在加载或没有更多数据，直接返回
    if (state.loading || (!state.hasMore && !reset)) {
      return
    }

    // 设置加载状态
    commit('SET_LOADING', true)

    try {
      // 当需要重置或是第一页时，重置状态
      if (reset) {
        commit('RESET_STATE')
      }

      // 构造请求参数
      const params = {
        keyword,
        current: reset ? 1 : state.current,
        size: state.size
      }

      // 只有当categoryId有值且不为null时才添加到参数中
      if (categoryId !== null && categoryId !== undefined) {
        params.categoryId = categoryId
      }

      // 调用API
      const response = await getFoodList(params)

      if (response.code === 200) {
        const { records, total } = response.data

        // // 延迟执行，确保加载状态显示足够时间
        // await new Promise(resolve => setTimeout(resolve, 500))

        // 更新食物列表
        commit('SET_FOOD_LIST', {
          records,
          isFirstPage: params.current === 1
        })

        // 更新分页信息
        commit('SET_PAGINATION', {
          total,
          current: params.current + 1, // 自动增加页码
          size: state.size
        })
      }

      return response
    } catch (error) {
      console.error('获取食物列表失败', error)
      return Promise.reject(error)
    } finally {
      commit('SET_LOADING', false)
    }
  },

  /**
   * 获取食物分类
   */
  async getFoodCategories({ commit }) {
    try {
      const response = await getFoodCategories()

      if (response.code === 200) {
        // 新的返回结构：data.records 包含分类列表
        const categories = response.data.records || response.data
        commit('SET_FOOD_CATEGORIES', categories)
      }

      return response
    } catch (error) {
      console.error('获取食物分类失败', error)
      return Promise.reject(error)
    }
  },

  /**
   * 获取食物详情
   * @param {Object} context - Vuex上下文
   * @param {number} id - 食物ID
   */
  async getFoodDetail({ commit }, id) {
    try {
      const response = await getFoodDetail(id)

      if (response.code === 200) {
        commit('SET_CURRENT_FOOD', response.data)
      }

      return response
    } catch (error) {
      console.error('获取食物详情失败', error)
      return Promise.reject(error)
    }
  },

  /**
   * 设置当前选中的食物
   * @param {Object} context - Vuex上下文
   * @param {Object} food - 食物对象
   */
  setCurrentFood({ commit }, food) {
    commit('SET_CURRENT_FOOD', food)
  }
}

const getters = {
  // 是否还有更多数据
  hasMoreFood: state => state.hasMore,

  // 是否正在加载
  isLoading: state => state.loading,

  // 获取当前食物
  currentFood: state => state.currentFood
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}