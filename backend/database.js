const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const folder = path.join(__dirname, 'data');
fs.mkdirSync(folder, {recursive:true});
const db = new Database(path.join(folder, 'catalogue.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS collections (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL UNIQUE,
 image TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL COLLATE NOCASE UNIQUE,
 category TEXT NOT NULL REFERENCES collections(id) ON DELETE RESTRICT,
 image TEXT NOT NULL DEFAULT '',
 video TEXT NOT NULL DEFAULT '',
 description TEXT NOT NULL DEFAULT '',
 price REAL NOT NULL DEFAULT 0 CHECK(price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
`);
const seed = db.prepare('INSERT OR IGNORE INTO collections(id,name) VALUES (?,?)');
db.transaction(() => {
 seed.run('adult', 'Adult collection');
 seed.run('kid', 'Kid collection');
})();
module.exports = db;