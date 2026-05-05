/*
 * Файл: backend/routes/offers.js
 * Отвечает за: CRUD предложений ментора.
 * Используется в: server.js.
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const Offer = require('../models/Offer');
const { authenticate, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

// GET /api/offers/mentor/:mentorId
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const offers = await Offer.findByMentor(req.params.mentorId);
    res.json({ offers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/offers
router.post('/', authenticate, requireRole('mentor'), [
  body('title').notEmpty().withMessage('Название обязательно'),
], handleValidationErrors, async (req, res) => {
  try {
    const { title, description, category, price_type, price_amount } = req.body;
    const offer = await Offer.create({
      mentorId: req.user.id, title, description, category, price_type, price_amount,
    });
    res.status(201).json({ offer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/offers/:id
router.put('/:id', authenticate, requireRole('mentor'), async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Предложение не найдено' });
    if (offer.mentor_id !== req.user.id) return res.status(403).json({ error: 'Нет доступа' });
    const updated = await Offer.update(req.params.id, req.body);
    res.json({ offer: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/offers/:id
router.delete('/:id', authenticate, requireRole('mentor'), async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Предложение не найдено' });
    if (offer.mentor_id !== req.user.id) return res.status(403).json({ error: 'Нет доступа' });
    await Offer.remove(req.params.id);
    res.json({ message: 'Предложение скрыто' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
