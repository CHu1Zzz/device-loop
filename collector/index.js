/**
 * 采集模块入口脚本
 * 支持手动触发和定时任务调用
 *
 * 使用方式：
 *   npm run collect              # 全量采集
 *   npm run collect -- --source xianyu  # 只采集闲鱼
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { KEYWORDS, PLATFORMS } from './keywords.js';
import { collectXianyu } from './platforms/xianyu.js';
import { collectXiaohongshu } from './platforms/xiaohongshu.js';
import { collectTieba } from './platforms/tieba.js';

// 命令行参数解析
const args = process.argv.slice(2);
let targetPlatforms = PLATFORMS;

// 解析 --source 参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source' && args[i + 1]) {
    targetPlatforms = [args[i + 1]];
    break;
  }
}

// 确保数据目录存在
const dataDir = 'data/raw';
const errorDir = 'data/errors';
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(errorDir)) mkdirSync(errorDir, { recursive: true });

// 采集调度映射
const collectors = {
  xianyu: collectXianyu,
  xiaohongshu: collectXiaohongshu,
  tieba: collectTieba,
};

// 平台中文名映射
const platformNames = {
  xianyu: '闲鱼',
  xiaohongshu: '小红书',
  tieba: '百度贴吧',
};

// 采集延迟（毫秒），避免触发风控
const COLLECT_DELAY = 3000;

/**
 * 主采集流程
 */
async function runCollection() {
  const date = new Date().toISOString().slice(0, 10);
  const timestamp = new Date().toISOString();
  console.log(chalk.bold.cyan(`\n=== [${timestamp}] 开始采集任务 ===`));
  console.log(chalk.gray(`目标平台: ${targetPlatforms.map(p => platformNames[p]).join(', ')}`));
  console.log(chalk.gray(`关键词数量: ${KEYWORDS.length}\n`));

  let totalCollected = 0;
  let totalErrors = 0;
  const allItems = [];

  for (const platform of targetPlatforms) {
    const collector = collectors[platform];
    if (!collector) {
      console.warn(chalk.yellow(`[${platformNames[platform]}] 未知的采集器，跳过`));
      continue;
    }

    console.log(chalk.bold `\n--- [${platformNames[platform]}] 开始采集 ---`);

    for (const keyword of KEYWORDS) {
      const items = await collector(keyword, 10);
      if (items.length > 0) {
        allItems.push(...items);
        totalCollected += items.length;
        console.log(chalk.green(`  ✓ "${keyword}" 采集到 ${items.length} 条`));
      } else {
        console.log(chalk.gray(`  - "${keyword}" 无数据`));
      }

      // 采集间隔，避免触发风控
      await sleep(COLLECT_DELAY);
    }
  }

  // 保存原始数据
  const rawFile = join(dataDir, `${date}.json`);
  const dataToSave = {
    date,
    timestamp,
    collected_at: new Date().toISOString(),
    total: allItems.length,
    items: allItems,
  };

  writeFileSync(rawFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
  console.log(chalk.bold.cyan `\n=== 采集完成 ===`);
  console.log(chalk.green(`总计采集: ${totalCollected} 条`));
  console.log(chalk.gray(`数据已保存: ${rawFile}`));

  return { total: totalCollected, items: allItems };
}

/**
 * 错误日志记录
 */
function logError(context, error) {
  const date = new Date().toISOString().slice(0, 10);
  const errorFile = join(errorDir, `${date}-errors.log`);
  const logEntry = `[${new Date().toISOString()}] [${context}] ${error.message}\n`;
  appendFile(errorFile, logEntry);
}

/**
 * 追加写入文件
 */
function appendFile(filePath, content) {
  const dir = filePath.substring(0, filePath.lastIndexOf('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, { flag: 'a' }, 'utf-8');
}

/**
 * 睡眠函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行采集
runCollection()
  .then(result => {
    console.log(chalk.bold.cyan('\n采集任务执行成功'));
    process.exit(0);
  })
  .catch(error => {
    console.error(chalk.red('\n采集任务执行失败:'), error.message);
    logError('collector-main', error);
    process.exit(1);
  });