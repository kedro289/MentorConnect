/*
 * Файл: backend/routes/favorites.js
 * Отвечает за: избранные менторы — добавление, удаление, список.
 * Используется в: server.js (GET/POST/DELETE /api/favorites).
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/favorites — список избранных текущего студента
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.mentor_id, f.created_at,
              mp.full_name, mp.avg_rating, mp.total_reviews,
              mp.expertise, mp.price_type, mp.price_amount, mp.avatar_url
       FROM favorites f
       JOIN mentor_profiles mp ON mp.user_id = f.mentor_id
       WHERE f.student_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json({ favorites: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/favorites — добавить в избранное { mentorId }
router.post('/', authenticate, async (req, res) => {
  const { mentorId } = req.body;
  if (!mentorId) return res.status(400).json({ error: 'mentorId обязателен' });
  try {
    await pool.query(
      'INSERT INTO favorites (student_id, mentor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, mentorId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/favorites/:mentorId — убрать из избранного
router.delete('/:mentorId', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE student_id = $1 AND mentor_id = $2',
      [req.user.id, parseInt(req.params.mentorId, 10)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
