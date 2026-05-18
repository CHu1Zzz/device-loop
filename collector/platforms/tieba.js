/**
 * 百度贴吧平台采集适配器
 * 使用 OpenCLI 进行数据采集
 */
import { execSync } from 'child_process';
import chalk from 'chalk';

export async function collectTieba(keyword, limit = 10) {
  console.log(chalk.blue(`[百度贴吧] 开始采集关键词: ${keyword}`));
  try {
    const cmd = `opencli tieba search "${keyword}" --limit ${limit} --format json`;
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const data = JSON.parse(output);
    return normalizeTiebaData(data, keyword);
  } catch (error) {
    console.error(chalk.red(`[百度贴吧] 采集失败: ${error.message}`));
    return [];
  }
}

function normalizeTiebaData(items, keyword) {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    id: `tieba_${hashString(item.id || item.thread_id || item.title || JSON.stringify(item))}`,
    source: 'tieba',
    title: item.title || item.topic || '',
    price: parsePrice(item.price || item.amount),
    location: normalizeLocation(item.location || item.area || ''),
    contact: maskContact(item.contact || item.phone || item.wechat || ''),
    url: item.url || item.link || `https://tieba.baidu.com/p/${item.id || item.thread_id}`,
    images: item.images || item.pics || [],
    raw_text: item.raw_text || item.content || item.description || JSON.stringify(item),
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