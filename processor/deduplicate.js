/**
 * 去重逻辑模块
 * 基于 标题+价格+地区 组合哈希进行去重
 * 同一条信息24小时内不重复入库
 */
import { computeDedupeKey } from './priceParser.js';

/**
 * 检测是否是重复数据
 * @param {object} item - 待检测的数据项
 * @param {Set<string>} existingKeys - 已存在的去重键集合
 * @param {number} hours - 时间窗口（小时）
 * @returns {boolean} 是否重复
 */
export function isDuplicate(item, existingKeys, hours = 24) {
  const key = computeDedupeKey(item);
  return existingKeys.has(key);
}

/**
 * 生成去重键
 */
export { computeDedupeKey };

/**
 * 批量去重
 * @param {Array} items - 数据项数组
 * @param {Set<string>} existingKeys - 已存在的去重键集合
 * @returns {Array} 去重后的数据项
 */
export function deduplicate(items, existingKeys) {
  return items.filter(item => {
    const key = computeDedupeKey(item);
    if (existingKeys.has(key)) {
      return false;
    }
    existingKeys.add(key);
    return true;
  });
}