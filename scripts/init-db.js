/**
 * 数据库初始化脚本
 * 运行方式：npm run init:db
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import { SCHEMA } from '../api/db/schema.sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../data/app.db');
const dataDir = join(__dirname, '../data');

async function initDb() {
  console.log('正在初始化数据库...');

  // 确保数据目录存在
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(SCHEMA);

  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));

  console.log(`数据库已创建: ${DB_PATH}`);
}

initDb()
  .then(() => {
    console.log('数据库初始化完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('初始化失败:', error);
    process.exit(1);
  });