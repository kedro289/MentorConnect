/*
 * Файл: backend/models/Review.js
 * Отвечает за: CRUD для таблицы reviews.
 * Используется в: routes/reviews.js.
 */

const pool = require('../config/db');

async function create({ studentId, mentorId, rating, comment }) {
  const { rows } = await pool.query(
    `INSERT INTO reviews (student_id, mentor_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [studentId, mentorId, rating, comment]
  );
  return rows[0];
}

async function getByMentor(mentorId) {
  const { rows } = await pool.query(
    `SELECT r.*, sp.full_name AS student_name, u.email AS student_email
     FROM reviews r
     JOIN users u ON u.id = r.student_id
     LEFT JOIN student_profiles sp ON sp.user_id = r.student_id
     WHERE r.mentor_id = $1
     ORDER BY r.created_at DESC`,
    [mentorId]
  );
  return rows;
}

async function hasAcceptedApplication(studentId, mentorId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM applications
     WHERE student_id = $1 AND mentor_id = $2 AND status = 'accepted'`,
    [studentId, mentorId]
  );
  return rows.length > 0;
}

module.exports = { create, getByMentor, hasAcceptedApplication };
