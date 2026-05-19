/**
 * 信号评分器
 * 基于配置文件中的规则计算线索评分(0-100)
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 加载信号规则配置
const configPath = join(__dirname, '../config/signal_rules.json');
let signalConfig = null;

function loadConfig() {
  if (!signalConfig) {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      signalConfig = JSON.parse(configData);
    } catch (e) {
      console.error('[Scorer] Failed to load config:', e.message);
      signalConfig = { positive_signals: [], negative_signals: [], combo_bonus: [] };
    }
  }
  return signalConfig;
}

/**
 * 标准化文本用于匹配
 */
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase();
}

/**
 * 检查文本中包含的信号词
 */
function findSignals(text, signals) {
  const normalized = normalizeText(text);
  const found = [];

  for (const signal of signals) {
    if (normalized.includes(normalizeText(signal.keyword))) {
      found.push(signal);
    }
  }

  return found;
}

/**
 * 计算组合加成
 */
function calculateComboBonus(foundSignals, combos) {
  const foundKeywords = foundSignals.map(s => s.keyword);

  for (const combo of combos) {
    const allMatch = combo.signals.every(s => foundKeywords.includes(s));
    if (allMatch) {
      return combo.bonus;
    }
  }

  return 0;
}

/**
 * 计算线索评分
 * @param {Object} item - 线索对象 { title, raw_text, ... }
 * @returns {Object} - { score: number, intent: string, matched_signals: Object }
 */
export function scoreItem(item) {
  const config = loadConfig();

  const textToAnalyze = normalizeText(
    (item.title || '') + ' ' + (item.raw_text || item.description || '')
  );

  // 1. 找出正向和负向信号
  const positiveSignals = findSignals(textToAnalyze, config.positive_signals);
  const negativeSignals = findSignals(textToAnalyze, config.negative_signals);

  // 2. 计算基础分 (从50开始)
  let baseScore = 50;
  let positiveScore = 0;
  let negativeScore = 0;
  const matchedSignals = {
    positive: [],
    negative: [],
    tags: [],
  };

  // 累加正向信号权重
  for (const signal of positiveSignals) {
    positiveScore += signal.weight;
    matchedSignals.positive.push({
      keyword: signal.keyword,
      weight: signal.weight,
      category: signal.category,
    });
    matchedSignals.tags.push(signal.keyword);
  }

  // 累加负向信号权重
  for (const signal of negativeSignals) {
    negativeScore += signal.weight; // weight已经是负数
    matchedSignals.negative.push({
      keyword: signal.keyword,
      weight: signal.weight,
      category: signal.category,
    });
    matchedSignals.tags.push('!' + signal.keyword);
  }

  // 3. 计算组合加成
  const comboBonus = calculateComboBonus(positiveSignals, config.combo_bonus);

  // 4. 最终评分 = 基础分 + 正向分 + 负向分 + 组合加成
  let finalScore = baseScore + positiveScore + negativeScore + comboBonus;

  // 限制在0-100范围内
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

  // 5. 确定意向等级
  const thresholds = config.intent_thresholds;
  let intent = 'low';

  if (finalScore >= thresholds.high.min) {
    intent = 'high';
  } else if (finalScore >= thresholds.medium.min) {
    intent = 'medium';
  }

  return {
    score: finalScore,
    intent: intent,
    matched_signals: matchedSignals,
    positive_score: positiveScore,
    negative_score: negativeScore,
    combo_bonus: comboBonus,
  };
}

/**
 * 批量评分
 */
export function scoreItems(items) {
  return items.map(item => {
    const scoreResult = scoreItem(item);
    return {
      ...item,
      score: scoreResult.score,
      intent: scoreResult.intent,
      matched_signals: scoreResult.matched_signals,
    };
  });
}

export default { scoreItem, scoreItems };