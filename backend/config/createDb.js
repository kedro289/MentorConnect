/*
 * Файл: backend/config/createDb.js
 * Отвечает за: автоматическое применение схемы БД.
 * Используется в: seedDb.js, ручной инициализации.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function applySchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('✅ Схема применена успешно');
  await pool.end();
}

applySchema().catch(err => {
  console.error('❌ Ошибка применения схемы:', err.message);
  process.exit(1);
});
