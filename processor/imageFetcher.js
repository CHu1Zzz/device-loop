/**
 * 图片获取器
 * 根据不同平台从详情页爬取第一张图片
 */
import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * 获取第一张图片URL
 * @param {Object} item - 数据项
 * @returns {Promise<string|null>} 图片URL
 */
export async function fetchFirstImage(item) {
  if (!item || !item.url) return null;

  // 如果已有图片，直接返回第一张
  if (item.images && item.images.length > 0) {
    const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
    if (images.length > 0) return images[0];
  }

  // 从详情页爬取
  try {
    switch (item.source) {
      case 'xiaohongshu':
        return await fetchXiaohongshuImage(item.url);
      case 'xianyu':
        return await fetchXianyuImage(item.url);
      case 'tieba':
        return await fetchTiebaImage(item.url);
      default:
        return null;
    }
  } catch (error) {
    console.warn(chalk.yellow(`[图片获取] ${item.source} 获取失败: ${error.message}`));
    return null;
  }
}

/**
 * 小红书图片获取 - 需要登录，较难爬取
 */
async function fetchXiaohongshuImage(url) {
  try {
    // 使用 opencli 爬取小红书页面
    const cmd = `opencli xiaohongshu fetch "${url}" --format json`;
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 });
    const data = JSON.parse(output);
    if (data.images && data.images.length > 0) {
      return data.images[0];
    }
    if (data.image_list && data.image_list.length > 0) {
      return data.image_list[0];
    }
  } catch (e) {
    // 忽略错误
  }
  return null;
}

/**
 * 闲鱼图片获取
 */
async function fetchXianyuImage(url) {
  try {
    const cmd = `opencli xianyu fetch "${url}" --format json`;
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 });
    const data = JSON.parse(output);
    if (data.images && data.images.length > 0) {
      return data.images[0];
    }
    if (data.pics && data.pics.length > 0) {
      return data.pics[0];
    }
  } catch (e) {
    // 忽略错误
  }
  return null;
}

/**
 * 贴吧图片获取
 */
async function fetchTiebaImage(url) {
  try {
    const cmd = `opencli tieba fetch "${url}" --format json`;
    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 5 * 1024 * 1024 });
    const data = JSON.parse(output);
    if (data.images && data.images.length > 0) {
      return data.images[0];
    }
    if (data.pics && data.pics.length > 0) {
      return data.pics[0];
    }
  } catch (e) {
    // 忽略错误
  }
  return null;
}