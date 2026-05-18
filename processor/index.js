/**
 * 数据处理入口脚本
 * 将原始采集数据清洗、分类后存入数据库
 *
 * 使用方式：
 *   npm run process              # 处理今日原始数据
 *   npm run process -- --date 2025-01-01  # 处理指定日期
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import chalk from 'chalk';
import 'dotenv/config';
import { classify } from './classifier.js';
import { extractPrice } from './priceParser.js';
import { normalizeLocation } from './locationNormalizer.js';
import { deduplicate } from './deduplicate.js';
import { filterByContentType, logContentFilter } from './filters/content_type_filter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/app.db');
const dataDir = join(__dirname, '../data/raw');
const errorDir = join(__dirname, '../data/errors');
const logsDir = join(__dirname, '../logs');

const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || '90');

// 命令行参数解析
const args = process.argv.slice(2);
let targetDate = new Date().toISOString().slice(0, 10);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && args[i + 1]) {
    targetDate = args[i + 1];
    break;
  }
}

// 确保目录存在
if (!existsSync(dirname(DB_PATH))) mkdirSync(dirname(DB_PATH), { recursive: true });
if (!existsSync(errorDir)) mkdirSync(errorDir, { recursive: true });

let db;

/**
 * 初始化数据库
 */
async function initDatabase() {
  const SQL = await initSqlJs();
  let dbContent;

  if (existsSync(DB_PATH)) {
    dbContent = readFileSync(DB_PATH);
    db = new SQL.Database(dbContent);
  } else {
    db = new SQL.Database();
    // 创建表
    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        price REAL,
        location TEXT,
        contact TEXT,
        url TEXT,
        images TEXT,
        raw_text TEXT,
        category TEXT DEFAULT '未分类',
        keyword TEXT,
        collected_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        dedupe_key TEXT
      );

      CREATE TABLE IF NOT EXISTS collect_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        total_collected INTEGER,
        total_deduped INTEGER,
        total_inserted INTEGER,
        errors TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
      CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
      CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);
      CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
      CREATE INDEX IF NOT EXISTS idx_items_collected_at ON items(collected_at);
      CREATE INDEX IF NOT EXISTS idx_items_dedupe_key ON items(dedupe_key);
    `);
  }

  return db;
}

/**
 * 获取已存在的去重键（最近24小时）
 */
function getExistingKeys() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const result = db.exec(`
    SELECT dedupe_key FROM items
    WHERE collected_at > '${oneDayAgo}'
    AND dedupe_key IS NOT NULL
  `);

  const keys = new Set();
  if (result.length > 0) {
    for (const row of result[0].values) {
      keys.add(row[0]);
    }
  }
  return keys;
}

/**
 * 时效性过滤：检查数据是否在保留期内
 * @param {Object} item - 单条数据
 * @returns {Object} - { passed: boolean, reason: string }
 */
function filterByRecency(item) {
  const now = Date.now();
  const retentionMs = DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const cutoffTime = now - retentionMs;

  // 优先使用 published_at（明确发布时间）
  if (item.published_at) {
    const publishedTime = new Date(item.published_at).getTime();
    if (publishedTime < cutoffTime) {
      return { passed: false, reason: `published_at ${item.published_at} 超过${DATA_RETENTION_DAYS}天` };
    }
    return { passed: true };
  }

  // 兜底使用 collected_at
  if (item.collected_at) {
    const collectedTime = new Date(item.collected_at).getTime();
    if (collectedTime < cutoffTime) {
      return { passed: false, reason: `collected_at ${item.collected_at} 超过${DATA_RETENTION_DAYS}天` };
    }
  }

  // 无时间字段，默认允许入库（采集时新数据）
  return { passed: true };
}

/**
 * 写入时效性过滤日志
 */
function logOutdatedFilter(filteredItems, date) {
  if (filteredItems.length === 0) return;

  if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

  const logFile = join(logsDir, `filtered_outdated_${date}.log`);
  const logLines = filteredItems.map(item =>
    `[${new Date().toISOString()}] 过滤: ${item.title} | 原因: ${item.filterReason}`
  ).join('\n');

  writeFileSync(logFile, logLines + '\n', { flag: 'a' });
  console.log(chalk.yellow(`[时效过滤] 写入日志: ${logFile} (${filteredItems.length} 条)`));
}

/**
 * 处理单条数据
 */
function processItem(item) {
  return {
    id: item.id || `processed_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    source: item.source || 'unknown',
    title: (item.title || '').slice(0, 500),
    price: item.price || extractPrice(item.raw_text || ''),
    location: normalizeLocation(item.location || ''),
    contact: item.contact,
    url: item.url || '',
    images: JSON.stringify(item.images || []),
    raw_text: (item.raw_text || '').slice(0, 5000),
    category: classify(item.title + ' ' + (item.raw_text || '')),
    keyword: item.keyword || '',
    collected_at: item.collected_at || new Date().toISOString(),
    status: 'active',
    dedupe_key: '',
  };
}

/**
 * 保存到数据库
 */
function saveToDatabase(items) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO items (
      id, source, title, price, location, contact, url, images,
      raw_text, category, keyword, collected_at, status, dedupe_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (const item of items) {
    stmt.run([
      item.id, item.source, item.title, item.price, item.location,
      item.contact, item.url, item.images, item.raw_text, item.category,
      item.keyword, item.collected_at, item.status, item.dedupe_key
    ]);
    inserted++;
  }
  stmt.free();

  // 保存数据库文件
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

/**
 * 记录处理日志
 */
function logCollect(date, totalCollected, totalDeduped, totalInserted, errors = []) {
  const stmt = db.prepare(`
    INSERT INTO collect_logs (date, timestamp, total_collected, total_deduped, total_inserted, errors)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    date,
    new Date().toISOString(),
    totalCollected,
    totalDeduped,
    totalInserted,
    JSON.stringify(errors)
  ]);
  stmt.free();

  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * 主处理流程
 */
async function runProcess() {
  console.log(chalk.bold.cyan(`\n=== [数据处理] 开始处理 ${targetDate} 的数据 ===\n`));

  // 读取原始数据
  const rawFile = join(dataDir, `${targetDate}.json`);
  if (!existsSync(rawFile)) {
    console.error(chalk.red(`[错误] 找不到原始数据文件: ${rawFile}`));
    return { success: false, error: '数据文件不存在' };
  }

  const rawData = JSON.parse(readFileSync(rawFile, 'utf-8'));
  const allItems = rawData.items || [];

  console.log(chalk.gray(`原始数据: ${allItems.length} 条\n`));

  // 初始化数据库
  db = await initDatabase();

  // 时效性过滤（在清洗之前过滤，减少资源浪费）
  const outdatedItems = [];
  const recencyPassedItems = [];
  for (const item of allItems) {
    const result = filterByRecency(item);
    if (result.passed) {
      recencyPassedItems.push(item);
    } else {
      item.filterReason = result.reason;
      outdatedItems.push(item);
    }
  }
  console.log(chalk.gray(`时效过滤: ${allItems.length - recencyPassedItems.length} 条过期，已移除`));
  if (outdatedItems.length > 0) {
    logOutdatedFilter(outdatedItems, targetDate);
  }

  // 内容类型过滤（教程/课程类）
  const contentResult = filterByContentType(recencyPassedItems);
  console.log(chalk.gray(`内容过滤: ${contentResult.filtered.length} 条教程/课程类，已标记`));
  if (contentResult.filtered.length > 0) {
    logContentFilter(contentResult.filtered, targetDate);
  }

  // 数据清洗和分类（只处理通过内容过滤的）
  const processedItems = contentResult.passed.map(processItem);
  console.log(chalk.gray(`清洗后: ${processedItems.length} 条`));

  // 去重
  const existingKeys = getExistingKeys();
  console.log(chalk.gray(`历史去重键: ${existingKeys.size} 条\n`));

  const uniqueItems = deduplicate(processedItems, existingKeys);
  const dedupedCount = processedItems.length - uniqueItems.length;
  console.log(chalk.gray(`去重后: ${uniqueItems.length} 条（去除 ${dedupedCount} 条重复）\n`));

  // 入库
  if (uniqueItems.length > 0) {
    saveToDatabase(uniqueItems);
    console.log(chalk.green(`入库成功: ${uniqueItems.length} 条`));
  }

  // 记录日志
  logCollect(targetDate, allItems.length, dedupedCount, uniqueItems.length);

  console.log(chalk.bold.cyan(`\n=== 处理完成 ===\n`));

  return {
    success: true,
    totalCollected: allItems.length,
    deduped: dedupedCount,
    inserted: uniqueItems.length,
  };
}

// 运行处理
runProcess()
  .then(result => {
    if (result.success) {
      console.log(chalk.green('处理任务执行成功'));
      process.exit(0);
    } else {
      console.error(chalk.red('处理任务执行失败:', result.error));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(chalk.red('处理任务异常:'), error.message);
    process.exit(1);
  });