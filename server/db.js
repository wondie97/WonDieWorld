
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "wondie.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// users: 계정 + 레벨/경험치/재화
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  exp INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  gem INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
`);

// 아이템 마스터
db.exec(`
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  type TEXT NOT NULL DEFAULT 'misc',  -- weapon / armor / tool / etc
  base_attack INTEGER NOT NULL DEFAULT 0,
  base_defense INTEGER NOT NULL DEFAULT 0,
  equip_slot TEXT DEFAULT NULL,       -- head/body/legs/tool 등
  description TEXT DEFAULT NULL
);
`);

// 유저 인벤토리
db.exec(`
CREATE TABLE IF NOT EXISTS user_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  equipped_slot TEXT DEFAULT NULL,  -- 장비 중이면 어떤 슬롯인지
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_user_items_user ON user_items(user_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_user_items_item ON user_items(item_id);`);

module.exports = db;
