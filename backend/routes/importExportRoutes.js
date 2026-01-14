const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const exportController = require('../controllers/exportController');
const importController = require('../controllers/importController');
const upload = require('../middleware/uploadMiddleware');

// Все маршруты требуют авторизации
router.use(authenticateToken);

// ===== ЭКСПОРТ =====

// GET /api/import-export/export/csv - экспорт в CSV
router.get('/export/csv', exportController.exportToCSV);

// GET /api/import-export/export/json - экспорт в JSON
router.get('/export/json', exportController.exportToJSON);

// ===== ИМПОРТ =====

// POST /api/import-export/import/csv - импорт из CSV
router.post('/import/csv', upload.single('file'), importController.importFromCSV);

// POST /api/import-export/import/json - импорт из JSON
router.post('/import/json', upload.single('file'), importController.importFromJSON);

module.exports = router;