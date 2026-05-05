/*
 * Файл: backend/routes/chats.js
 * Отвечает за: заявки на менторство, чаты, историю сообщений.
 * Используется в: server.js.
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { notify } = require('../utils/notify');
const { authenticate, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

// POST /api/applications — отправить заявку (студент)
router.post('/applications', authenticate, requireRole('student'), [
  body('mentorId').isInt().withMessage('mentorId должен быть числом'),
], handleValidationErrors, async (req, res) => {
  const { mentorId, message } = req.body;
  try {
    const app = await Chat.createApplication({
      studentId: req.user.id,
      mentorId: parseInt(mentorId, 10),
      message,
    });
    // Уведомить ментора о новой заявке (реалтайм)
    notify({
      userId: parseInt(mentorId, 10),
      type:  'new_application',
      title: 'Новая заявка на менторство',
      body:  message ? message.slice(0, 120) : 'Студент хочет учиться у вас',
      link:  '/pages/mentor-dashboard.html',
    });
    res.status(201).json({ application: app });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Заявка уже отправлена' });
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/applications/incoming — входящие заявки (ментор)
router.get('/applications/incoming', authenticate, requireRole('mentor'), async (req, res) => {
  try {
    const apps = await Chat.getIncomingApplications(req.user.id);
    res.json({ applications: apps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/applications/my — мои заявки (студент)
router.get('/applications/my', authenticate, requireRole('student'), async (req, res) => {
  const pool = require('../config/db');
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.email AS mentor_email, mp.full_name AS mentor_name
       FROM applications a
       JOIN users u ON u.id = a.mentor_id
       LEFT JOIN mentor_profiles mp ON mp.user_id = a.mentor_id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json({ applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/applications/:id/accept — принять заявку
router.put('/applications/:id/accept', authenticate, requireRole('mentor'), async (req, res) => {
  try {
    const app = await Chat.findApplicationById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Заявка не найдена' });
    if (app.mentor_id !== req.user.id) return res.status(403).json({ error: 'Нет доступа' });
    await Chat.updateApplicationStatus(req.params.id, 'accepted');
    const chat = await Chat.createChat({
      studentId: app.student_id,
      mentorId: app.mentor_id,
      applicationId: app.id,
    });
    // Уведомить студента о принятии заявки (реалтайм)
    notify({
      userId: app.student_id,
      type:  'application_accepted',
      title: 'Заявка принята!',
      body:  'Ментор принял вашу заявку. Можете начать общение в чате.',
      link:  `/pages/chat.html?chatId=${chat.id}`,
    });
    res.json({ message: 'Заявка принята', chat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/applications/:id/reject — отклонить заявку
router.put('/applications/:id/reject', authenticate, requireRole('mentor'), async (req, res) => {
  try {
    const app = await Chat.findApplicationById(req.params.id);
    if (!app) return res.status(404).json({ error: 'Заявка не найдена' });
    if (app.mentor_id !== req.user.id) return res.status(403).json({ error: 'Нет доступа' });
    await Chat.updateApplicationStatus(req.params.id, 'rejected');
    // Уведомить студента об отклонении заявки (реалтайм)
    notify({
      userId: app.student_id,
      type:  'application_rejected',
      title: 'Заявка отклонена',
      body:  'К сожалению, ментор не смог принять вашу заявку.',
      link:  '/pages/student-dashboard.html',
    });
    res.json({ message: 'Заявка отклонена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/chats — список чатов пользователя
router.get('/chats', authenticate, async (req, res) => {
  try {
    const chats = await Chat.getUserChats(req.user.id);
    res.json({ chats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/chats/:chatId/messages — история сообщений
router.get('/chats/:chatId/messages', authenticate, async (req, res) => {
  try {
    const chat = await Chat.findChatById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });
    if (chat.student_id !== req.user.id && chat.mentor_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    const messages = await Message.getChatMessages(req.params.chatId);
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
