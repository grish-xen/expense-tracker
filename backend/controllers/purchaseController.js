const pool = require('../database/db');

// Получить все покупки пользователя
const getPurchases = async (req, res) => {
    try {
        const userId = req.userId;

        // Получаем параметры из запроса
        const {
            category,
            start_date,
            end_date,
            page = 1,
            limit = 20
        } = req.query;

        // Рассчитываем offset для пагинации
        const offset = (page - 1) * limit;

        // Строим базовый запрос
        let query = `
      SELECT p.* FROM purchases p 
      WHERE p.user_id = ? 
    `;
        const params = [userId];

        // Добавляем фильтры
        if (category) {
            query += ' AND p.category = ?';
            params.push(category);
        }

        if (start_date) {
            query += ' AND p.purchase_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND p.purchase_date <= ?';
            params.push(end_date);
        }

        // Добавляем сортировку и пагинацию
        query += ' ORDER BY p.purchase_date DESC, p.created_at DESC';
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        // Получаем покупки
        const [purchases] = await pool.execute(query, params);

        // Получаем общее количество для пагинации
        let countQuery = 'SELECT COUNT(*) as total FROM purchases WHERE user_id = ?';
        const countParams = [userId];

        if (category) {
            countQuery += ' AND category = ?';
            countParams.push(category);
        }

        if (start_date) {
            countQuery += ' AND purchase_date >= ?';
            countParams.push(start_date);
        }

        if (end_date) {
            countQuery += ' AND purchase_date <= ?';
            countParams.push(end_date);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: purchases,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Ошибка при получении покупок:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
};

// Добавить покупку
const addPurchase = async (req, res) => {
    try {
        const userId = req.userId;
        const { item_name, price, category, purchase_date } = req.body;

        // Проверяем обязательные поля
        if (!item_name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Название, цена и категория обязательны'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO purchases (user_id, item_name, price, category, purchase_date) 
       VALUES (?, ?, ?, ?, ?)`,
            [userId, item_name, price, category, purchase_date || new Date().toISOString().split('T')[0]]
        );

        res.status(201).json({
            success: true,
            message: 'Покупка добавлена',
            purchase_id: result.insertId
        });

    } catch (error) {
        console.error('Ошибка при добавлении покупки:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
};

// Обновить покупку
const updatePurchase = async (req, res) => {
    try {
        const userId = req.userId;
        const purchaseId = req.params.id;
        const { item_name, price, category, purchase_date } = req.body;

        // Проверяем, что есть хотя бы одно поле для обновления
        if (!item_name && !price && !category && !purchase_date) {
            return res.status(400).json({
                success: false,
                message: 'Нет данных для обновления'
            });
        }

        // Собираем поля для обновления
        const updates = [];
        const values = [];

        if (item_name) {
            updates.push('item_name = ?');
            values.push(item_name);
        }
        if (price) {
            updates.push('price = ?');
            values.push(price);
        }
        if (category) {
            updates.push('category = ?');
            values.push(category);
        }
        if (purchase_date) {
            updates.push('purchase_date = ?');
            values.push(purchase_date);
        }

        // Добавляем userId и purchaseId в конец
        values.push(purchaseId, userId);

        const [result] = await pool.execute(
            `UPDATE purchases 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Покупка не найдена или у вас нет прав для её редактирования'
            });
        }

        res.json({
            success: true,
            message: 'Покупка обновлена'
        });

    } catch (error) {
        console.error('Ошибка при обновлении покупки:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
};

module.exports = {
    getPurchases,
    addPurchase,
    updatePurchase
};