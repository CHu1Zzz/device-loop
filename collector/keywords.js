/**
 * 采集关键词列表 - 结构化版本
 * 分为信号词（Signal Words）和设备词（Equipment Terms）
 * 信号词用于匹配高意向转让场景
 * 设备词用于匹配具体设备类型
 */
export const SIGNAL_WORDS = [
  // 正向信号 - 闭店/急转/清仓
  '倒闭', '不干了', '急转', '清仓', '整店', '整套', '打包',
  '设备清仓', '饭店转让', '桌椅处理', '同城自提', '搬迁处理',
  '低价甩卖', '餐厅倒闭', '后厨设备', '店铺清仓',

  // 设备品类词（与设备词配合使用）
  '转让', '处理', '出售', '甩卖', '转手',
];

export const EQUIPMENT_WORDS = [
  '商用冰箱', '二手冰箱', '冰柜', '冷柜',
  '烤箱', '炸炉', '蒸箱', '灶台', '炒锅', '烤炉',
  '洗碗机', '消毒柜', '洗菜机',
  '商用灶台', '制冰机', '油烟机', '排烟罩',
  '货架', '储物柜', '工作台', '操作台',
  '收银机', '点餐机', '餐饮设备', '厨房设备',
];

// 搜索关键词 = 信号词 + 设备词的所有组合
export const KEYWORDS = buildSearchKeywords();

// 平台配置
export const PLATFORMS = ['xianyu', 'xiaohongshu', 'tieba'];

/**
 * 构建搜索关键词列表
 * 格式：信号词 + 空格 + 设备词（用于搜索）
 */
function buildSearchKeywords() {
  const keywords = [];

  // 优先使用强信号词 + 设备词组合
  const strongSignals = ['倒闭', '不干了', '急转', '清仓', '整店', '整套', '打包', '转让'];
  const weakSignals = ['处理', '出售', '甩卖', '转手'];

  for (const signal of strongSignals) {
    for (const equipment of EQUIPMENT_WORDS) {
      keywords.push(`${signal} ${equipment}`);
    }
  }

  // 也添加设备词 + 弱信号组合
  for (const equipment of EQUIPMENT_WORDS) {
    for (const signal of weakSignals) {
      keywords.push(`${equipment} ${signal}`);
    }
  }

  // 去重
  return [...new Set(keywords)];
}