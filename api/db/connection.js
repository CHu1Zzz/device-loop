/**
 * 数据库连接模块
 * 使用 sql.js（SQLite in WASM）实现数据库操作
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';
import { SCHEMA } from './schema.sql.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../data/app.db');

let db = null;

/**
 * 获取数据库实例（单例模式）
 */
export async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  const dataDir = join(__dirname, '../../data');

  // 确保数据目录存在
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // 加载或创建数据库
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    saveDb();
  }

  return db;
}

/**
 * 保存数据库到文件
 */
export function saveDb() {
  if (!db) return;
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

/**
 * 执行查询
 */
export function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * 执行插入/更新
 */
export function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified() };
}

/**
 * 关闭数据库连接
 */
export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}