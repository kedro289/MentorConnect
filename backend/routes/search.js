/*
 * Файл: backend/routes/search.js
 * Отвечает за: полнотекстовый поиск менторов с фильтрами, сортировкой и пагинацией.
 * Используется в: server.js (GET /api/mentors/search).
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

const SORT_MAP = {
  rating:          'mp.avg_rating DESC, mp.total_reviews DESC',
  reviews:         'mp.total_reviews DESC, mp.avg_rating DESC',
  price_asc:       'mp.price_amount ASC  NULLS LAST',
  price_desc:      'mp.price_amount DESC NULLS LAST',
  experience:      'mp.experience_years DESC NULLS LAST',
  newest:          'mp.updated_at DESC',
  rating_score:    'mp.rating_score DESC NULLS LAST',
  rating_reviews:  'mp.rating_reviews DESC NULLS LAST',
  rating_activity: 'mp.rating_activity DESC NULLS LAST',
  rating_response: 'mp.rating_response DESC NULLS LAST',
};

// GET /api/mentors/search
router.get('/search', async (req, res) => {
  let {
    keyword, category, minRating, minRatingScore, priceType, maxPrice,
    minExperience, sort = 'rating', page = 1, limit = 12,
  } = req.query;

  // Sanitize pagination
  page  = Math.max(1, parseInt(page,  10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (page - 1) * limit;

  const conditions = ['u.is_blocked = FALSE'];
  const params = [];
  let idx = 1;

  if (keyword && keyword.trim()) {
    const kw = keyword.trim();
    // Ищем в имени, биографии, опыте, экспертизе и предложениях ментора
    conditions.push(`(
      mp.full_name      ILIKE $${idx}
      OR mp.bio         ILIKE $${idx}
      OR mp.experience_text ILIKE $${idx}
      OR EXISTS (
        SELECT 1 FROM unnest(mp.expertise) AS e WHERE e ILIKE $${idx}
      )
      OR EXISTS (
        SELECT 1 FROM offers o
        WHERE o.mentor_id = mp.user_id AND o.is_active = TRUE
          AND (o.title ILIKE $${idx} OR o.category ILIKE $${idx})
      )
    )`);
    params.push(`%${kw}%`);
    idx++;
  }

  if (category && category.trim()) {
    // Поиск категории в массиве экспертизы (case-insensitive)
    conditions.push(`EXISTS (
      SELECT 1 FROM unnest(mp.expertise) AS e WHERE e ILIKE $${idx}
    )`);
    params.push(`%${category.trim()}%`);
    idx++;
  }

  if (minRating) {
    conditions.push(`mp.avg_rating >= $${idx}`);
    params.push(parseFloat(minRating));
    idx++;
  }

  if (minRatingScore) {
    conditions.push(`mp.rating_score >= $${idx}`);
    params.push(parseFloat(minRatingScore));
    idx++;
  }

  if (priceType) {
    conditions.push(`mp.price_type = $${idx}`);
    params.push(priceType);
    idx++;
  }

  if (maxPrice) {
    conditions.push(`(mp.price_type = 'free' OR mp.price_amount <= $${idx})`);
    params.push(parseFloat(maxPrice));
    idx++;
  }

  if (minExperience) {
    conditions.push(`mp.experience_years >= $${idx}`);
    params.push(parseInt(minExperience, 10));
    idx++;
  }

  const where   = 'WHERE ' + conditions.join(' AND ');
  const orderBy = SORT_MAP[sort] || SORT_MAP.rating;

  try {
    const baseQuery = `
      FROM mentor_profiles mp
      JOIN users u ON u.id = mp.user_id
      ${where}`;

    const [countRes, mentorsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)${baseQuery}`, params),
      pool.query(
        `SELECT
           mp.user_id AS id, mp.full_name, mp.bio, mp.expertise,
           mp.experience_years, mp.avatar_url, mp.price_type,
           mp.price_amount, mp.avg_rating, mp.total_reviews, mp.updated_at,
           mp.rating_score, mp.rating_reviews, mp.rating_activity,
           mp.rating_sessions, mp.rating_response
         ${baseQuery}
         ORDER BY ${orderBy}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count, 10);
    const pages = Math.ceil(total / limit) || 1;

    res.json({
      mentors: mentorsRes.rows,
      total,
      page,
      pages,
      hasMore: page < pages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
