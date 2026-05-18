/**
 * 数据库 Schema 定义
 * 使用 sql.js（SQLite in WASM）
 */

// 建表语句
export const SCHEMA = `
-- 主数据表：存储清洗后的结构化数据
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

-- 采集日志表
CREATE TABLE IF NOT EXISTS collect_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  total_collected INTEGER,
  total_deduped INTEGER,
  total_inserted INTEGER,
  errors TEXT
);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  keyword TEXT,
  province TEXT,
  price_max REAL,
  contact TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
CREATE INDEX IF NOT EXISTS idx_items_location ON items(location);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_collected_at ON items(collected_at);
CREATE INDEX IF NOT EXISTS idx_items_dedupe_key ON items(dedupe_key);
`;

export default SCHEMA;