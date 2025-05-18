import request from '@/utils/request'

/**
 * 添加饮食记录
 * @param {Object} data - 饮食记录数据
 * @param {string} data.date - 日期，格式：YYYY-MM-DD
 * @param {string} data.time - 时间，格式：HH:mm
 * @param {string} data.mealType - 餐次类型：breakfast/lunch/dinner/snacks
 * @param {string} data.remark - 备注信息
 * @param {number} data.totalCalorie - 总热量
 * @param {Array} data.foods - 食物列表
 * @returns {Promise}
 */
export function addDietRecord(data) {
  return request({
    url: '/api/diet-records',
    method: 'post',
    data
  })
}

/**
 * 获取饮食记录列表
 * @param {Object} params - 查询参数
 * @param {string} [params.startDate] - 开始日期
 * @param {string} [params.endDate] - 结束日期
 * @param {string} [params.mealType] - 餐次类型
 * @param {number} [params.page=1] - 当前页码
 * @param {number} [params.size=10] - 每页大小
 * @returns {Promise}
 */
export function getDietRecords(params) {
  return request({
    url: '/api/diet-records',
    method: 'get',
    data: params
  })
}

/**
 * 获取饮食记录详情
 * @param {number} id - 记录ID
 * @returns {Promise}
 */
export function getDietRecordDetail(id) {
  return request({
    url: `/api/diet-records/${id}`,
    method: 'get'
  })
}

/**
 * 删除饮食记录
 * @param {number} id - 记录ID
 * @returns {Promise}
 */
export function deleteDietRecord(id) {
  return request({
    url: `/api/diet-records/${id}`,
    method: 'delete'
  })
} 