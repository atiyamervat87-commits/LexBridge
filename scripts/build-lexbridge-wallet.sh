#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "========================================"
echo " LEXBRIDGE - LEVERAGE STRIKE"
echo " ACCOUNT + WALLET FOUNDATION"
echo "========================================"

ROOT="$(pwd)"

echo
echo "===== 1. PROJECT CHECK ====="

[ -f package.json ] || {
  echo "ERROR: package.json NOT FOUND"
  exit 1
}

[ -f server.js ] || {
  echo "ERROR: server.js NOT FOUND"
  exit 1
}

echo "PROJECT=$ROOT"

echo
echo "===== 2. CURRENT STATUS ====="
git status --short

echo
echo "===== 3. INSTALL SQLITE DRIVER ====="

node -e "try { require.resolve('better-sqlite3'); console.log('BETTER_SQLITE3_ALREADY_INSTALLED'); } catch(e) { process.exit(1); }" \
  || npm install better-sqlite3

echo
echo "===== 4. CREATE DATABASE FOUNDATION ====="

cat > database.js <<'JS'
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "data");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "lexbridge.sqlite");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
ON users(username);

CREATE TABLE IF NOT EXISTS wallets (
    wallet_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    currency TEXT NOT NULL DEFAULT 'EGP',
    available_minor INTEGER NOT NULL DEFAULT 0,
    reserved_minor INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    version INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    transaction_id TEXT PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    direction TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    balance_before_minor INTEGER NOT NULL,
    balance_after_minor INTEGER NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    idempotency_key TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(wallet_id) REFERENCES wallets(wallet_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    CHECK(amount_minor > 0),
    CHECK(direction IN ('credit','debit')),
    CHECK(type IN (
        'deposit',
        'withdrawal',
        'gift',
        'gift_reward',
        'refund',
        'adjustment',
        'transfer_in',
        'transfer_out'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS
idx_wallet_transactions_idempotency
ON wallet_transactions(user_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS
idx_wallet_transactions_wallet_created
ON wallet_transactions(wallet_id, created_at);

CREATE INDEX IF NOT EXISTS
idx_wallet_transactions_reference
ON wallet_transactions(reference_type, reference_id);
`);

console.log("DATABASE_READY");
console.log("DB_PATH=" + DB_PATH);

db.close();
JS

echo
echo "DATABASE_JS_CREATED"

echo
echo "===== 5. PACKAGE CHECK ====="

node - <<'JS'
const p = require("./package.json");

if (!p.dependencies || !p.dependencies["better-sqlite3"]) {
    throw new Error("BETTER_SQLITE3_NOT_REGISTERED");
}

console.log("BETTER_SQLITE3_REGISTERED=" + p.dependencies["better-sqlite3"]);
JS

echo
echo "===== 6. SYNTAX CHECK ====="

node --check database.js
node --check server.js

echo "DATABASE_SYNTAX_OK"
echo "SERVER_SYNTAX_OK"

echo
echo "===== 7. DATABASE INITIALIZATION ====="

node - <<'JS'
const { db, DB_PATH } = (() => {
    const Database = require("better-sqlite3");
    const path = require("path");

    const DB_PATH = path.join(__dirname, "data", "lexbridge.sqlite");
    const db = new Database(DB_PATH);

    return { db, DB_PATH };
})();

db.pragma("foreign_keys = ON");

const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
`).all();

console.log("DB_PATH=" + DB_PATH);
console.log("TABLES=" + tables.map(x => x.name).join(","));

const required = [
    "users",
    "wallets",
    "wallet_transactions"
];

for (const table of required) {
    if (!tables.some(x => x.name === table)) {
        throw new Error("MISSING_TABLE_" + table);
    }
}

const integrity = db.prepare("PRAGMA integrity_check").get();

console.log("INTEGRITY=" + integrity.integrity_check);

if (integrity.integrity_check !== "ok") {
    throw new Error("DATABASE_INTEGRITY_FAILED");
}

db.close();

console.log("DATABASE_SCHEMA_OK");
JS

echo
echo "===== 8. SERVER STATUS BEFORE PATCH ====="

grep -nE \
'const express|express\.json|app\.get|app\.post|server\.listen|PORT|MALIK_BRIDGE_URL' \
server.js | head -100 || true

echo
echo "========================================"
echo " FOUNDATION CREATED"
echo "========================================"
echo
echo "IMPORTANT:"
echo "NO BACKUP"
echo "NO COMMIT"
echo "NO PUSH"
echo
echo "Existing public/malik-chat.html modification was not intentionally changed."
echo
echo "===== FINAL GIT STATUS ====="
git status --short

echo
echo "===== DIFF STAT ====="
git diff --stat

echo
echo "LEXBRIDGE_LEVERAGE_STRIKE_FINISHED"
