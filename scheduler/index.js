/**
 * 定时任务调度器
 * 采集任务：每天 08:00、14:00、20:00 各执行一次
 * 处理任务：采集完成后自动触发
 * 数据清理：每天凌晨清理过期数据 + 每周日凌晨清理原始备份文件
 */
import cron from 'node-cron';
import { execSync } from 'child_process';
import { readFileSync, existsSync, unlinkSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import 'dotenv/config';
import initSqlJs from 'sql.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dataDir = join(__dirname, '../data/raw');
const logsDir = join(__dirname, '../logs');
const DB_PATH = join(__dirname, '../data/app.db');

const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || '90');

// 确保目录存在
const fs = await import('fs');
if (!existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

/**
 * 执行外部脚本
 */
function runScript(scriptPath, label) {
  console.log(chalk.blue(`[调度器] 开始执行: ${label}`));
  try {
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    console.log(chalk.green(`[调度器] 执行完成: ${label}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`[调度器] 执行失败: ${label}`), error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 写入日志
 */
function writeLog(taskName, startTime, result) {
  const endTime = new Date().toISOString();
  const duration = Date.now() - new Date(startTime).getTime();
  const date = new Date().toISOString().slice(0, 10);
  const logFile = join(logsDir, `${date}.log`);

  const logEntry = `[${endTime}] [${taskName}] 耗时: ${duration}ms 结果: ${result.success ? '成功' : '失败'}\n`;
  fs.writeFileSync(logFile, logEntry, { flag: 'a' });
}

/**
 * 清理过期原始数据文件
 */
function cleanupOldData() {
  if (!existsSync(dataDir)) return;

  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const file of files) {
    const filePath = join(dataDir, file);
    const stat = fs.statSync(filePath);
    if (stat.mtimeMs < thirtyDaysAgo) {
      unlinkSync(filePath);
      console.log(chalk.gray(`[清理] 已删除过期文件: ${file}`));
    }
  }
}

/**
 * 清理数据库中过期的items记录
 */
async function cleanupOutdatedItems() {
  if (!existsSync(DB_PATH)) return;

  const SQL = await initSqlJs();
  const dbContent = readFileSync(DB_PATH);
  const db = new SQL.Database(dbContent);

  const cutoffDate = new Date(Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // 查询将被删除的记录数
  const countResult = db.exec(`SELECT COUNT(*) FROM items WHERE collected_at < '${cutoffDate}' AND status = 'active'`);
  const countToDelete = countResult.length > 0 ? countResult[0].values[0][0] : 0;

  if (countToDelete > 0) {
    // 执行删除
    db.run(`DELETE FROM items WHERE collected_at < '${cutoffDate}' AND status = 'active'`);

    // 保存数据库
    const data = db.export();
    writeFileSync(DB_PATH, Buffer.from(data));

    console.log(chalk.yellow(`[清理] 已删除 ${countToDelete} 条过期记录 (collected_at < ${cutoffDate})`));

    // 写入日志
    const logFile = join(logsDir, `cleanup_${new Date().toISOString().slice(0, 10)}.log`);
    const logEntry = `[${new Date().toISOString()}] [cleanup_outdated] 删除 ${countToDelete} 条过期记录\n`;
    writeFileSync(logFile, logEntry, { flag: 'a' });
  }

  db.close();
}

// 采集任务 cron：每天 08:00、14:00、20:00
const collectCron = '0 8,14,20 * * *';
cron.schedule(collectCron, () => {
  const startTime = new Date().toISOString();
  console.log(chalk.bold.cyan(`[${startTime}] [调度器] 采集任务开始`));

  const result = runScript(join(__dirname, '../collector/index.js'), '数据采集');

  // 采集完成后自动触发处理
  if (result.success) {
    runScript(join(__dirname, '../processor/index.js'), '数据处理');
  }

  writeLog('采集+处理', startTime, result);
});

// 清理任务 cron：每天凌晨 2:00
const cleanupCron = '0 2 * * *';
cron.schedule(cleanupCron, () => {
  const startTime = new Date().toISOString();
  console.log(chalk.bold.cyan(`[${startTime}] [调度器] 清理任务开始`));

  // 清理数据库中的过期记录
  cleanupOutdatedItems();

  // 清理过期的原始数据文件
  cleanupOldData();

  writeLog('数据清理', startTime, { success: true });
});

console.log(chalk.bold.cyan('[调度器] 定时任务已启动'));
console.log(chalk.gray(`  采集任务: ${collectCron}`));
console.log(chalk.gray(`  清理任务: ${cleanupCron}`));