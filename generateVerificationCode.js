const sqlite3 = require("sqlite3").verbose();
const crypto = require("crypto");
const { Command } = require("commander");
const { CHAINS, LIMIT_NUMBER } = require("./config");

const program = new Command();
program
  .option("-c, --chain <string>", "Chain is", "conflux")
  .option("-n, --number <number>", "Number is", LIMIT_NUMBER);
program.parse(process.argv);
const commandOptions = program.opts();

if (!CHAINS.includes(commandOptions.chain)) {
  console.log(`${commandOptions.chain} chain is invalid`);
  process.exit(1);
}

if (commandOptions.number > LIMIT_NUMBER) {
  console.log(`${commandOptions.number} is invalid exceed limit 1000`);
  process.exit(1);
}

// 连接到 SQLite 数据库，或者创建一个新的数据库文件
const db = new sqlite3.Database("recordonchain.db");

// 不同链的存在不同的表中
const table = `verification_code_${commandOptions.chain}`;

// 创建表
db.run(`
    CREATE TABLE IF NOT EXISTS ${table} (
      code TEXT PRIMARY KEY,
      selled INT NOT NULL DEFAULT 0,
      verified INT NOT NULL DEFAULT 0,
      locked INT NOT NULL DEFAULT 0
    )
  `);

// 生成 8 位随机整数，再加上不同链的大写首字母作为 code 值
function generateUniqueCodes(n) {
  const codes = new Set();
  while (codes.size < n) {
    const randomCode = crypto.randomInt(10000000, 100000000); // 生成 8 位随机整数
    codes.add(`${commandOptions.chain.charAt(0).toUpperCase()}${randomCode}`);
  }
  return Array.from(codes);
}

// 批量插入生成的随机数到数据库
function insertCodesToDatabase(codes) {
  const placeholders = codes.map(() => "(?)").join(",");
  const sql = `INSERT INTO ${table} (code) VALUES ${placeholders} ON CONFLICT(code) DO NOTHING`;

  db.run(sql, codes, function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`成功插入 ${codes.length} 条数据`);
  });
}

// 生成并插入 2000 个随机不重复的 code
const codes = generateUniqueCodes(commandOptions.number);
insertCodesToDatabase(codes);

// 关闭数据库
db.close();
