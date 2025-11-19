const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "db.sqlite");
const db = new sqlite3.Database(dbPath);

// 기본 테이블들 초기화
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      nickname TEXT,
      x REAL DEFAULT 0,
      y REAL DEFAULT 0,
      direction TEXT DEFAULT 'down',
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      friend_id INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_user INTEGER,
      from_user INTEGER,
      item TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      taken INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS market (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller INTEGER,
      item TEXT,
      price INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sold INTEGER DEFAULT 0
    )
  `);
});

module.exports = db;
