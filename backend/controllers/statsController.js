const pool = require('../database/db');

// Получить статистику по категориям
const getStatsByCategory = async (req, res) => {
    try {
        const userId = req.userId;
        const { start_date, end_date } = req.query;

        // Базовый запрос
        let query = `
      SELECT 
        category,
        COUNT(*) as purchase_count,
        SUM(price) as total_amount,
        ROUND(AVG(price), 2) as average_price
      FROM purchases 
      WHERE user_id = ? 
    `;

        const params = [userId];

        // Добавляем фильтры по дате, если есть
        if (start_date) {
            query += ' AND purchase_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND purchase_date <= ?';
            params.push(end_date);
        }

        // Группируем по категориям
        query += ' GROUP BY category ORDER BY total_amount DESC';

        const [categories] = await pool.execute(query, params);

        // Считаем общую сумму
        const total = categories.reduce((sum, cat) => sum + parseFloat(cat.total_amount), 0);

        // Добавляем проценты
        const categoriesWithPercent = categories.map(cat => ({
            ...cat,
            percentage: total > 0 ? Math.round((cat.total_amount / total) * 100) : 0
        }));

        // Получаем самые дорогие покупки
        const [mostExpensive] = await pool.execute(
            `SELECT item_name, price, category, purchase_date 
       FROM purchases 
       WHERE user_id = ? 
       ORDER BY price DESC 
       LIMIT 5`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                period: {
                    start_date: start_date || 'не указано',
                    end_date: end_date || 'не указано'
                },
                summary: {
                    total_amount: total,
                    purchase_count: categories.reduce((sum, cat) => sum + cat.purchase_count, 0),
                    category_count: categories.length
                },
                categories: categoriesWithPercent,
                most_expensive: mostExpensive
            }
        });

    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при получении статистики'
        });
    }
};

// Получить общую сводку
const getSummary = async (req, res) => {
    try {
        const userId = req.userId;
        const { month, year } = req.query;

        let dateFilter = '';
        const params = [userId];

        // Фильтр по месяцу и году
        if (month && year) {
            dateFilter = ' AND MONTH(purchase_date) = ? AND YEAR(purchase_date) = ?';
            params.push(month, year);
        } else if (month) {
            dateFilter = ' AND MONTH(purchase_date) = ?';
            params.push(month);
        } else if (year) {
            dateFilter = ' AND YEAR(purchase_date) = ?';
            params.push(year);
        }

        // Общая статистика
        const [summary] = await pool.execute(
            `SELECT 
        COUNT(*) as total_purchases,
        SUM(price) as total_spent,
        MIN(price) as min_price,
        MAX(price) as max_price,
        ROUND(AVG(price), 2) as avg_price
       FROM purchases 
       WHERE user_id = ? ${dateFilter}`,
            params
        );

        // Статистика по дням недели
        const [byWeekday] = await pool.execute(
            `SELECT 
        DAYNAME(purchase_date) as weekday,
        COUNT(*) as purchase_count,
        SUM(price) as total_amount
       FROM purchases 
       WHERE user_id = ? ${dateFilter}
       GROUP BY WEEKDAY(purchase_date), DAYNAME(purchase_date)
       ORDER BY WEEKDAY(purchase_date)`,
            params
        );

        res.json({
            success: true,
            data: {
                summary: summary[0],
                by_weekday: byWeekday
            }
        });

    } catch (error) {
        console.error('Ошибка при получении сводки:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера при получении сводки'
        });
    }
};

module.exports = { getStatsByCategory, getSummary };