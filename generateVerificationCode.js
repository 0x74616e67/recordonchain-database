const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

// 连接到 SQLite 数据库，或者创建一个新的数据库文件
const db = new sqlite3.Database("recordonchain.db");

// 创建表
db.run(`
  CREATE TABLE IF NOT EXISTS verification_code (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code INTEGER UNIQUE,
    selled INT NOT NULL DEFAULT 0,
    verified INT NOT NULL DEFAULT 0
  )
`);

// 生成 8 位随机整数
function generateUniqueCodes(n) {
  const codes = new Set();
  while (codes.size < n) {
    const randomCode = crypto.randomInt(10000000, 100000000); // 生成 8 位随机整数
    codes.add(randomCode);
  }
  return Array.from(codes);
}

// 批量插入生成的随机数到数据库
function insertCodesToDatabase(codes) {
  const placeholders = codes.map(() => "(?)").join(",");
  // const sql = `INSERT INTO verification_code (code) VALUES ${placeholders}`;
  const sql = `INSERT INTO verification_code (code) VALUES ${placeholders} ON CONFLICT(code) DO NOTHING`;

  db.run(sql, codes, function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`成功插入 ${codes.length} 条数据`);
  });
}

// 生成并插入 2000 个随机不重复的 8 位 code
const codes = generateUniqueCodes(2000);
insertCodesToDatabase(codes);

// 关闭数据库
db.close();
