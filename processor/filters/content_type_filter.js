/**
 * 内容类型过滤器
 * 过滤教程/课程类信息，只保留实体设备转让信息
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, '../../logs');

// 课程/教程类过滤关键词
const EXCLUDE_KEYWORDS = [
  // 教学内容
  '教程', '课程', '教学', '配方', '秘方', '配比',
  '技术转让', '技术出售', '技术出让',
  '全套教程', '视频教程', '图文教程',
  '手把手教', '学习资料', '培训资料',

  // 培训类
  '培训班', '实训课', '特训课', '学徒',
  '拜师', '师傅教', '加盟培训',

  // 配方类
  '独家配方', '秘制配方', '商用配方',
  '卤料配方', '底料配方', '酱料配方',

  // 数字产品特征词
  '自动发货', '网盘链接', '百度云',
  '永久观看', '无限次学习',

  // 明显非设备
  '加盟费', '代理权', '品牌授权',
];

/**
 * 标准化文本：转全角、转小写
 */
function normalizeText(text) {
  if (!text) return '';
  // 转小写
  let normalized = text.toLowerCase();
  // 全角转半角（可选，取决于数据来源）
  // 这里只做小写匹配
  return normalized;
}

/**
 * 检查标题或正文中是否包含过滤关键词
 * @param {Object} item - 单条数据
 * @returns {Object} - { matched: boolean, keywords: string[] }
 */
function checkContentMatch(item) {
  const textToCheck = normalizeText(
    (item.title || '') + ' ' + (item.raw_text || '')
  );

  const matchedKeywords = [];
  for (const keyword of EXCLUDE_KEYWORDS) {
    if (textToCheck.includes(normalizeText(keyword))) {
      matchedKeywords.push(keyword);
    }
  }

  return {
    matched: matchedKeywords.length > 0,
    keywords: matchedKeywords,
  };
}

/**
 * 内容类型过滤主函数
 * @param {Array} items - 待过滤的数据列表
 * @returns {Object} - { filtered: Array, passed: Array, stats: Object }
 */
export function filterByContentType(items) {
  const filtered = [];
  const passed = [];
  const keywordStats = {};

  for (const item of items) {
    const result = checkContentMatch(item);

    if (result.matched) {
      item._filter_reason = 'content_type';
      item._matched_keywords = result.keywords;
      filtered.push(item);

      // 统计关键词命中次数
      for (const kw of result.keywords) {
        keywordStats[kw] = (keywordStats[kw] || 0) + 1;
      }
    } else {
      passed.push(item);
    }
  }

  return {
    filtered,
    passed,
    stats: {
      total: items.length,
      filtered_count: filtered.length,
      passed_count: passed.length,
      keyword_stats: keywordStats,
    },
  };
}

/**
 * 写入过滤日志
 */
export function logContentFilter(filteredItems, date) {
  if (filteredItems.length === 0) return;

  if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

  const logFile = join(logsDir, `filtered_content_${date}.log`);

  const logLines = filteredItems.map(item =>
    `[${new Date().toISOString()}] 过滤: ${item.title} | 命中: ${item._matched_keywords.join(', ')}`
  ).join('\n');

  writeFileSync(logFile, logLines + '\n', { flag: 'a' });
  console.log(`[内容过滤] 写入日志: ${logFile} (${filteredItems.length} 条)`);
}

export default { filterByContentType, logContentFilter };