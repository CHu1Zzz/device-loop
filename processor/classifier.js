/**
 * 设备类型自动分类器
 * 基于关键词规则进行设备分类，无需AI
 */
export const CATEGORIES = {
  '制冷设备': ['冰箱', '冰柜', '冷柜', '制冰机', '冷藏', '冷冻'],
  '烹饪设备': ['烤箱', '炸炉', '蒸箱', '灶台', '炒锅', '烤炉'],
  '清洗设备': ['洗碗机', '消毒柜', '洗菜机'],
  '储存设备': ['货架', '储物柜', '工作台'],
  '其他设备': ['收银机', '点餐机', '排烟罩'],
};

/**
 * 根据标题和文本内容分类设备类型
 * @param {string} title - 标题
 * @param {string} rawText - 原始文本
 * @returns {string} 设备类型
 */
export function classify(text) {
  const combined = (text || '').toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return '未分类';
}