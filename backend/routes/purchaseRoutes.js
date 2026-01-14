const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const purchaseController = require('../controllers/purchaseController');

// ВСЕ маршруты ниже требуют авторизации
router.use(authenticateToken);

// GET /api/purchases - получить все покупки пользователя
router.get('/', purchaseController.getPurchases);

// POST /api/purchases - добавить новую покупку
router.post('/', purchaseController.addPurchase);

// PUT /api/purchases/:id - обновить покупку
router.put('/:id', purchaseController.updatePurchase);

// DELETE /api/purchases/:id - удалить покупку
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.userId;
        const purchaseId = req.params.id;

        const pool = require('../database/db');
        const [result] = await pool.execute(
            'DELETE FROM purchases WHERE id = ? AND user_id = ?',
            [purchaseId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Покупка не найдена'
            });
        }

        res.json({
            success: true,
            message: 'Покупка удалена'
        });

    } catch (error) {
        console.error('Ошибка при удалении покупки:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

module.exports = router;