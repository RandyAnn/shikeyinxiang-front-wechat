import request from '@/utils/request'

/**
 * 获取食物列表（分页）
 * @param {Object} params - 查询参数
 * @param {string} [params.keyword] - 搜索关键词
 * @param {number} [params.categoryId] - 分类ID
 * @param {number} [params.current=1] - 当前页码
 * @param {number} [params.size=10] - 每页大小
 * @returns {Promise}
 */
export function getFoodList(params) {
  return request({
    url: '/api/food/list',
    method: 'get',
    data: params
  })
}

/**
 * 获取食物分类列表
 * @returns {Promise}
 */
export function getFoodCategories() {
  return request({
    url: '/api/food/categories',
    method: 'get'
  })
}

/**
 * 获取食物详情
 * @param {number} id - 食物ID
 * @returns {Promise}
 */
export function getFoodDetail(id) {
  return request({
    url: `/api/food/${id}`,
    method: 'get'
  })
}