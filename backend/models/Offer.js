/*
 * Файл: backend/models/Offer.js
 * Отвечает за: CRUD для таблицы offers.
 * Используется в: routes/offers.js.
 */

const pool = require('../config/db');

async function findByMentor(mentorId) {
  const { rows } = await pool.query(
    'SELECT * FROM offers WHERE mentor_id = $1 AND is_active = TRUE ORDER BY created_at DESC',
    [mentorId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM offers WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ mentorId, title, description, category, price_type, price_amount }) {
  const { rows } = await pool.query(
    `INSERT INTO offers (mentor_id, title, description, category, price_type, price_amount)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [mentorId, title, description, category, price_type || 'free', price_amount]
  );
  return rows[0];
}

async function update(id, { title, description, category, price_type, price_amount, is_active }) {
  const { rows } = await pool.query(
    `UPDATE offers
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         price_type = COALESCE($4, price_type),
         price_amount = COALESCE($5, price_amount),
         is_active = COALESCE($6, is_active),
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [title, description, category, price_type, price_amount, is_active, id]
  );
  return rows[0] || null;
}

async function remove(id) {
  await pool.query('UPDATE offers SET is_active = FALSE WHERE id = $1', [id]);
}

module.exports = { findByMentor, findById, create, update, remove };
