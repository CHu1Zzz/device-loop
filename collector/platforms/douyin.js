/**
 * 抖音平台采集适配器
 * 使用 OpenCLI 进行数据采集
 */
import { execSync } from 'child_process';
import chalk from 'chalk';

export async function collectDouyin(keyword, limit = 10) {
  console.log(chalk.blue(`[抖音] 开始采集关键词: ${keyword}`));
  console.log(chalk.yellow(`[抖音] 警告: opencli douyin hashtag search 暂不可用，跳过采集`));
  return [];
}

function normalizeDouyinData(items, keyword) {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    id: `douyin_${hashString(item.id || item.aweme_id || item.title || JSON.stringify(item))}`,
    source: 'douyin',
    title: item.title || item.desc || '',
    price: parsePrice(item.price || item.amount),
    location: normalizeLocation(item.location || item.poi || item.address || ''),
    contact: maskContact(item.contact || item.phone || item.wechat || ''),
    url: item.url || item.share_url || item.link || '',
    images: item.images || item.pics || item.image_list || [],
    raw_text: item.raw_text || item.desc || item.description || JSON.stringify(item),
    collected_at: new Date().toISOString(),
    status: 'active',
    keyword,
  }));
}

function parsePrice(price) {
  if (!price) return null;
  const num = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

function normalizeLocation(location) {
  if (!location) return null;
  const map = { '沪': '上海市', '京': '北京市', '粤': '广东省', '浙': '浙江省', '苏': '江苏省' };
  for (const [abbr, full] of Object.entries(map)) {
    if (location.includes(abbr)) return full;
  }
  return location;
}

function maskContact(contact) {
  if (!contact) return null;
  const str = String(contact);
  if (/^\d{11}$/.test(str)) {
    return str.slice(0, 3) + '****' + str.slice(-4);
  }
  return str;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}