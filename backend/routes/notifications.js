/*
 * Файл: backend/routes/notifications.js
 * Отвечает за: CRUD уведомлений пользователя через REST API.
 * Используется в: backend/server.js.
 */

const express = require('express');
const router  = express.Router();

const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications — список уведомлений текущего пользователя
router.get('/', authenticate, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  || '30', 10), 100);
  const offset = Math.max(parseInt(req.query.offset || '0',  10), 0);
  try {
    const [items, unread] = await Promise.all([
      Notification.getByUser(req.user.id, { limit, offset }),
      Notification.getUnreadCount(req.user.id),
    ]);
    res.json({ notifications: items, unread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/notifications/unread-count — только счётчик непрочитанных
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/notifications/read-all — отметить все прочитанными
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.markAllRead(req.user.id);
    res.json({ message: 'Все уведомления прочитаны' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/notifications/:id/read — отметить одно прочитанным
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notif = await Notification.markRead(req.params.id, req.user.id);
    if (!notif) return res.status(404).json({ error: 'Уведомление не найдено' });
    res.json({ notification: notif });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/notifications/:id — удалить уведомление
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await Notification.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Уведомление не найдено' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
