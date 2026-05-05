/*
 * Файл: backend/utils/notify.js
 * Отвечает за: создание уведомления в БД и реалтайм emit в персональную Socket.IO комнату.
 * Используется в: backend/server.js (setIo), routes/chats.js, routes/reviews.js, sockets/chatSocket.js.
 */

const Notification = require('../models/Notification');

let _io = null;

function setIo(io) {
  _io = io;
}

async function notify({ userId, type, title, body = null, link = null }) {
  const notif = await Notification.safeCreate({ userId, type, title, body, link });
  if (notif && _io) {
    _io.to(`user_${userId}`).emit('notification', notif);
  }
  return notif;
}

module.exports = { setIo, notify };
