const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const statsController = require('../controllers/statsController');

// Все маршруты требуют авторизации
router.use(authenticateToken);

// GET /api/stats/by-category - статистика по категориям
router.get('/by-category', statsController.getStatsByCategory);

// GET /api/stats/summary - общая сводка
router.get('/summary', statsController.getSummary);

module.exports = router;