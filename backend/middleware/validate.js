/*
 * Файл: backend/middleware/validate.js
 * Отвечает за: обработку ошибок express-validator.
 * Используется в: routes/auth.js и других роутах с валидацией.
 */

const { validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = { handleValidationErrors };
