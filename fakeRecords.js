const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");

// 连接到 SQLite 数据库，或者创建一个新的数据库文件
const db = new sqlite3.Database("recordonchain.db");

async function fakeRecords(chain, count) {
  // 不同链的存在不同的表中
  const table = `records`;
  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS ${table} (
      hash TEXT PRIMARY KEY,
      timestamp INT DEFAULT 0,
      message TEXT,
      username TEXT,
      chain TEXT,
      level INT DEFAULT 0
    )
  `);

  let records = [];
  const timestampInSeconds = Math.floor(Date.now() / 1000);

  for (i = 0; i < count; i++) {
    const randomHash = crypto.randomBytes(32).toString("hex"); // 32 字节生成 64 位的十六进制字符串

    records.push({
      hash: randomHash,
      timestamp: timestampInSeconds - count + i,
      message: `${chain} ${randomHash}`,
    });
  }

  const sql = `INSERT INTO ${table} (hash, timestamp, message, chain) VALUES (?, ?, ?, ?) ON CONFLICT(hash) DO NOTHING`;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(sql);
    for (const record of records) {
      stmt.run(record.hash, record.timestamp, record.message, chain);
    }

    stmt.finalize();
    db.run("COMMIT");
  });

  db.close();
}
// 注意：不能同时执行，会报错，要一个个单独执行
// fakeRecords("confluxevmtestnet", 10);
// fakeRecords("conflux", 15);
// fakeRecords("ethereum", 24);
