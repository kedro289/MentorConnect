/*
 * Файл: backend/models/MentorProfile.js
 * Отвечает за: CRUD для таблицы mentor_profiles.
 * Используется в: routes/profiles.js, routes/search.js.
 */

const pool = require('../config/db');

async function findByUserId(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM mentor_profiles WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

async function findPublicById(userId) {
  const { rows } = await pool.query(
    `SELECT mp.*, u.email
     FROM mentor_profiles mp
     JOIN users u ON u.id = mp.user_id
     WHERE mp.user_id = $1 AND u.is_blocked = FALSE`,
    [userId]
  );
  return rows[0] || null;
}

async function update(userId, fields) {
  const { full_name, bio, expertise, experience_years, experience_text, portfolio_links,
          avatar_url, price_type, price_amount, available_schedule } = fields;
  const { rows } = await pool.query(
    `UPDATE mentor_profiles
     SET full_name = COALESCE($1, full_name),
         bio = COALESCE($2, bio),
         expertise = COALESCE($3, expertise),
         experience_years = COALESCE($4, experience_years),
         experience_text = COALESCE($5, experience_text),
         portfolio_links = COALESCE($6, portfolio_links),
         avatar_url = COALESCE($7, avatar_url),
         price_type = COALESCE($8, price_type),
         price_amount = COALESCE($9, price_amount),
         available_schedule = COALESCE($10, available_schedule),
         updated_at = NOW()
     WHERE user_id = $11
     RETURNING *`,
    [full_name, bio, expertise, experience_years, experience_text, portfolio_links,
     avatar_url, price_type, price_amount, available_schedule, userId]
  );
  return rows[0] || null;
}

module.exports = { findByUserId, findPublicById, update };
