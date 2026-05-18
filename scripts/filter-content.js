/**
 * 内容类型过滤脚本
 * 对数据库中现有数据进行内容过滤（教程/课程类）
 *
 * 使用方式：
 *   npm run filter:content          # 执行全量过滤
 *   npm run filter:report            # 输出过滤统计报告
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import chalk from 'chalk';
import { filterByContentType, logContentFilter } from '../processor/filters/content_type_filter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/app.db');
const logsDir = join(__dirname, '../logs');

async function getDb() {
  const SQL = await initSqlJs();
  const dbContent = readFileSync(DB_PATH);
  return new SQL.Database(dbContent);
}

function saveDb(db) {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * 统计报告模式：只输出统计，不实际修改数据
 */
async function runReport() {
  console.log(chalk.bold.cyan('\n=== [内容过滤报告] ===\n'));

  const db = await getDb();

  // 获取所有 active 状态的记录
  const result = db.exec(`
    SELECT id, title, raw_text, status
    FROM items
    WHERE status = 'active'
  `);

  if (result.length === 0) {
    console.log(chalk.gray('没有找到需要检查的数据'));
    db.close();
    return;
  }

  const items = result[0].values.map(row => ({
    id: row[0],
    title: row[1],
    raw_text: row[2],
    status: row[3],
  }));

  console.log(chalk.gray(`待检查总数: ${items.length}\n`));

  // 执行内容过滤
  const filterResult = filterByContentType(items);

  // 关键词命中统计
  console.log(chalk.bold('\n关键词命中统计:'));
  const sortedKeywords = Object.entries(filterResult.stats.keyword_stats)
    .sort((a, b) => b[1] - a[1]);

  for (const [keyword, count] of sortedKeywords.slice(0, 20)) {
    console.log(`  ${keyword}: ${count} 条`);
  }

  if (sortedKeywords.length > 20) {
    console.log(`  ... 还有 ${sortedKeywords.length - 20} 个关键词`);
  }

  console.log(chalk.bold('\n过滤统计:'));
  console.log(`  总记录数: ${filterResult.stats.total}`);
  console.log(chalk.red(`  将被过滤: ${filterResult.stats.filtered_count}`));
  console.log(chalk.green(`  将保留: ${filterResult.stats.passed_count}`));

  if (filterResult.filtered.length > 0) {
    console.log(chalk.bold('\n将被过滤的记录（前10条）:'));
    for (const item of filterResult.filtered.slice(0, 10)) {
      console.log(`  - [${item._matched_keywords.join(', ')}] ${item.title.slice(0, 60)}`);
    }
  }

  console.log(chalk.bold.cyan('\n=== 报告完成 ===\n'));

  db.close();
}

/**
 * 执行过滤模式：将命中关键词的记录标记为 filtered_content
 */
async function runFilter() {
  console.log(chalk.bold.cyan('\n=== [内容过滤] 开始执行全量过滤 ===\n'));

  const db = await getDb();

  // 获取所有 active 状态的记录
  const result = db.exec(`
    SELECT id, title, raw_text, status
    FROM items
    WHERE status = 'active'
  `);

  if (result.length === 0) {
    console.log(chalk.gray('没有找到需要过滤的数据'));
    db.close();
    return { success: true, filtered: 0 };
  }

  const items = result[0].values.map(row => ({
    id: row[0],
    title: row[1],
    raw_text: row[2],
    status: row[3],
  }));

  console.log(chalk.gray(`待检查总数: ${items.length}\n`));

  // 执行内容过滤
  const filterResult = filterByContentType(items);

  // 将命中的记录标记为 filtered_content
  if (filterResult.filtered.length > 0) {
    const stmt = db.prepare('UPDATE items SET status = ? WHERE id = ?');
    for (const item of filterResult.filtered) {
      stmt.run(['filtered_content', item.id]);
    }
    stmt.free();

    // 写入日志
    logContentFilter(filterResult.filtered, new Date().toISOString().slice(0, 10));

    saveDb(db);
  }

  console.log(chalk.green(`过滤完成！`));
  console.log(chalk.gray(`  检查: ${items.length} 条`));
  console.log(chalk.red(`  过滤: ${filterResult.filtered.length} 条`));
  console.log(chalk.green(`  保留: ${filterResult.passed.length} 条`));

  console.log(chalk.bold.cyan('\n=== 过滤完成 ===\n'));

  db.close();

  return {
    success: true,
    filtered: filterResult.filtered.length,
    passed: filterResult.passed.length,
  };
}

// 主入口
const args = process.argv.slice(2);
const isReport = args.includes('--report');

if (isReport) {
  runReport()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(chalk.red('执行失败:'), err.message);
      process.exit(1);
    });
} else {
  runFilter()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(chalk.red('执行失败:'), err.message);
      process.exit(1);
    });
}