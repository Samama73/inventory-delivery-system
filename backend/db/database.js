const Database = require('better-sqlite3');
const path = require('path');

// Database file 'inventory.db' backend folder me hi ban jayegi
const db = new Database(path.join('/data', 'inventory.db'));

// Better performance ke liye WAL mode enable karo
db.pragma('journal_mode = WAL');

// ---------- Tables banao (agar pehle se nahi hain to) ----------

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    low_stock_threshold INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(name, description) -- Yahan change kiya hai taaki Same Name + Different Description allow ho jaye
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
    delivery_date TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Naya Description column items table me add karne ke liye (agar database pehle se bana hua hai)
try {
  db.exec(`ALTER TABLE items ADD COLUMN description TEXT DEFAULT ''`);
} catch (e) {} // Column already exists to ignore karo

// Purane billing columns (Frontend se hata diye gaye hain, par safety ke liye yahan rakhe hain)
try {
  db.exec(`ALTER TABLE deliveries ADD COLUMN unit_price REAL DEFAULT 0`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE deliveries ADD COLUMN total_amount REAL DEFAULT 0`);
} catch (e) {}

// Naye fields: phone_number aur remarks
try {
  db.exec(`ALTER TABLE deliveries ADD COLUMN phone_number TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE deliveries ADD COLUMN remarks TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE items ADD COLUMN item_code TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE items ADD COLUMN category TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE items ADD COLUMN color TEXT DEFAULT ''`);   // 👈 ye naya add karo
} catch (e) {}

try {
  db.exec(`ALTER TABLE deliveries ADD COLUMN order_id TEXT`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE deliveries ADD COLUMN notes TEXT DEFAULT ''`);
} catch (e) {}

try {
  db.exec(`ALTER TABLE deliveries ADD COLUMN description TEXT DEFAULT ''`);
} catch (e) {}

module.exports = db;