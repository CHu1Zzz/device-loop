/**
 * 标签生成器
 * 基于信号评分结果生成结构化标签
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 标签类型定义
 */
export const TAG_TYPES = {
  // 线索类型
  TYPE_FULL_STORE: '整店清仓',
  TYPE_SINGLE_URGENT: '单品急转',
  TYPE_COMPETITOR: '同行广告',
  TYPE_SERVICE: '服务维修',
  TYPE_TUTORIAL: '教程资料',
  TYPE_SEEKING: '疑似求购',

  // 物流类型
  LOGISTICS_SELF_PICKUP: '同城自提',
  LOGISTICS_CAN_DELIVER: '可物流',
  LOGISTICS_UNKNOWN: '地区不明',

  // 货值类型
  VALUE_LARGE_SET: '大件成套',
  VALUE_FURNITURE_BATCH: '桌椅批量',
  VALUE_PARTS: '配件碎片',

  // 风险标记
  RISK_OLD_POST: '旧帖',
  RISK_NO_CONTACT: '无联系方式',
  RISK_COMPETITOR: '疑似同行',
  RISK_HOME_USE: '疑似家用',
};

/**
 * 根据 matched_signals 生成标签
 */
export function generateTags(item) {
  const tags = [];
  const signals = item.matched_signals || {};
  const positiveSignals = signals.positive || [];
  const negativeSignals = signals.negative || [];

  // 1. 根据正向信号生成类型标签
  const positiveKeywords = positiveSignals.map(s => s.keyword);

  if (positiveKeywords.some(k => ['整店', '整套', '打包'].includes(k))) {
    tags.push(TAG_TYPES.TYPE_FULL_STORE);
  } else if (positiveKeywords.some(k => ['急转', '清仓', '低价甩卖'].includes(k))) {
    tags.push(TAG_TYPES.TYPE_SINGLE_URGENT);
  }

  // 2. 根据负向信号生成类型标签
  const negativeKeywords = negativeSignals.map(s => s.keyword);

  if (negativeKeywords.some(k => ['培训', '教程', '配方', '网盘'].includes(k))) {
    tags.push(TAG_TYPES.TYPE_TUTORIAL);
  } else if (negativeKeywords.some(k => ['维修', '安装', '移机'].includes(k))) {
    tags.push(TAG_TYPES.TYPE_SERVICE);
  } else if (negativeKeywords.some(k => ['同行', '回收', '高价回收'].includes(k))) {
    tags.push(TAG_TYPES.TYPE_COMPETITOR);
  } else if (negativeKeywords.some(k => ['求购', '谁有', '哪里买'].includes(k))) {
    tags.push(TAG_TYPES.TYPE_SEEKING);
  }

  // 3. 物流标签
  if (positiveKeywords.includes('同城自提')) {
    tags.push(TAG_TYPES.LOGISTICS_SELF_PICKUP);
  }

  // 4. 货值标签
  if (positiveKeywords.some(k => ['整店', '整套', '打包'].includes(k))) {
    tags.push(TAG_TYPES.VALUE_LARGE_SET);
  } else if (positiveKeywords.includes('桌椅处理')) {
    tags.push(TAG_TYPES.VALUE_FURNITURE_BATCH);
  }

  // 5. 风险标签
  // 如果有负向信号中的同行/求购等
  if (negativeKeywords.some(k => ['同行', '家用'].includes(k))) {
    if (negativeKeywords.includes('同行')) {
      tags.push(TAG_TYPES.RISK_COMPETITOR);
    }
    if (negativeKeywords.includes('家用')) {
      tags.push(TAG_TYPES.RISK_HOME_USE);
    }
  }

  // 6. 如果没有任何正向信号，可能是低价值
  if (positiveSignals.length === 0 && negativeSignals.length > 0) {
    tags.push(TAG_TYPES.RISK_OLD_POST);
  }

  // 去重
  return [...new Set(tags)];
}

/**
 * 根据意向等级生成标签
 */
export function generateIntentTag(score, intent) {
  const intentLabels = {
    high: '🔥 高意向',
    medium: '📋 中意向',
    low: '📁 低意向',
  };
  return intentLabels[intent] || intentLabels.low;
}

/**
 * 批量生成标签
 */
export function tagItems(items) {
  return items.map(item => {
    const tags = generateTags(item);
    const intentTag = generateIntentTag(item.score, item.intent);
    return {
      ...item,
      tags: tags,
      intent_tag: intentTag,
    };
  });
}

export default { generateTags, tagItems, TAG_TYPES };