// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - регистрация нового пользователя
router.post('/register', authController.register);

// POST /api/auth/login - вход пользователя
router.post('/login', authController.login);

module.exports = router;