/**
 * 价格提取模块
 * 从原始文本中正则提取价格数字，单位统一为元
 */
import { classify } from './classifier.js';

/**
 * 从文本中提取价格
 * @param {string} text - 原始文本
 * @returns {number|null} 价格（单位：元）
 */
export function extractPrice(text) {
  if (!text) return null;

  // 匹配各种价格格式：
  // ¥1200 | 1200元 | 1200 | 价格1200 | 1,200 | 1200.00
  const patterns = [
    /¥\s*([\d,]+(?:\.\d{2})?)/g,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*元/g,
    /价格\s*[为是]?\s*([\d,]+(?:\.\d{2})?)/g,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0 && price < 10000000) {
        return price;
      }
    }
  }

  return null;
}

/**
 * 计算去重键
 * 组合标题 + 价格 + 地区 的哈希值
 * @param {object} item - 数据项
 * @returns {string} 去重键哈希
 */
export function computeDedupeKey(item) {
  const title = (item.title || '').replace(/\s+/g, '').slice(0, 50);
  const price = item.price || 0;
  const location = item.location || '';
  const raw = `${title}|${price}|${location}`;
  return hashString(raw);
}

/**
 * 字符串哈希函数
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}