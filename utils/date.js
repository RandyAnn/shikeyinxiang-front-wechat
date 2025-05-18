/**
 * 格式化日期
 * @param {Date} date 日期对象
 * @param {String} fmt 格式字符串，如 'yyyy-MM-dd'
 * @returns {String} 格式化后的日期字符串
 */
export function formatDate(date, fmt) {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date.replace(/-/g, '/'));
  }
  if (typeof date === 'number') {
    date = new Date(date);
  }
  
  const o = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    'S': date.getMilliseconds() // 毫秒
  };
  
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  
  return fmt;
}

/**
 * 获取日期范围
 * @param {String} type 范围类型：day, week, month, year
 * @param {Date} date 基准日期，默认为当前日期
 * @returns {Object} 包含开始日期和结束日期的对象
 */
export function getDateRange(type, date = new Date()) {
  const result = {
    start: new Date(date),
    end: new Date(date)
  };
  
  switch (type) {
    case 'day':
      result.start.setHours(0, 0, 0, 0);
      result.end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const day = date.getDay() || 7; // 如果是周日，getDay() 返回 0，我们将其视为 7
      result.start.setDate(date.getDate() - day + 1);
      result.start.setHours(0, 0, 0, 0);
      result.end.setDate(date.getDate() + (7 - day));
      result.end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      result.start.setDate(1);
      result.start.setHours(0, 0, 0, 0);
      result.end.setMonth(date.getMonth() + 1, 0);
      result.end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      result.start.setMonth(0, 1);
      result.start.setHours(0, 0, 0, 0);
      result.end.setMonth(11, 31);
      result.end.setHours(23, 59, 59, 999);
      break;
  }
  
  return result;
} 