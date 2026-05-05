/*
 * Файл: backend/models/User.js
 * Отвечает за: CRUD-операции с таблицей users.
 * Используется в: routes/auth.js, middleware/auth.js.
 */

const pool = require('../config/db');

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, role, is_blocked, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

async function create({ email, passwordHash, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, email, role, is_blocked, created_at`,
    [email, passwordHash, role]
  );
  return rows[0];
}

async function setBlocked(id, isBlocked) {
  const { rows } = await pool.query(
    'UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_blocked',
    [isBlocked, id]
  );
  return rows[0] || null;
}

module.exports = { findByEmail, findById, create, setBlocked };
