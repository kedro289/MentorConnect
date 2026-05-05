/*
 * Файл: backend/models/StudentProfile.js
 * Отвечает за: CRUD для таблицы student_profiles.
 * Используется в: routes/profiles.js.
 */

const pool = require('../config/db');

async function findByUserId(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM student_profiles WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

async function update(userId, { full_name, phone, interests, bio, avatar_url }) {
  const { rows } = await pool.query(
    `UPDATE student_profiles
     SET full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         interests = COALESCE($3, interests),
         bio = COALESCE($4, bio),
         avatar_url = COALESCE($5, avatar_url),
         updated_at = NOW()
     WHERE user_id = $6
     RETURNING *`,
    [full_name, phone, interests, bio, avatar_url, userId]
  );
  return rows[0] || null;
}

module.exports = { findByUserId, update };
