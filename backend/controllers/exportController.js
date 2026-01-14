const pool = require('../database/db');

// Экспорт покупок в CSV
const exportToCSV = async (req, res) => {
    try {
        const userId = req.userId;
        const { start_date, end_date } = req.query;

        // Запрос для получения покупок
        let query = `
      SELECT 
        purchase_date as "Дата",
        item_name as "Название",
        price as "Цена",
        category as "Категория",
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as "Дата добавления"
      FROM purchases 
      WHERE user_id = ? 
    `;

        const params = [userId];

        // Фильтры по дате
        if (start_date) {
            query += ' AND purchase_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND purchase_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY purchase_date DESC';

        const [purchases] = await pool.execute(query, params);

        // Если нет покупок
        if (purchases.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Нет данных для экспорта'
            });
        }

        // Создаём CSV заголовок
        const headers = Object.keys(purchases[0]).join(',');

        // Создаём CSV строки
        const csvRows = purchases.map(purchase => {
            return Object.values(purchase).map(value => {
                // Экранируем кавычки и запятые
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',');
        });

        // Объединяем заголовок и данные
        const csvContent = [headers, ...csvRows].join('\n');

        // Генерируем имя файла с текущей датой
        const today = new Date().toISOString().split('T')[0];
        const filename = `мои_покупки_${today}.csv`;

        // Устанавливаем заголовки для скачивания файла
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Отправляем CSV
        res.send(csvContent);

    } catch (error) {
        console.error('Ошибка при экспорте в CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при экспорте данных'
        });
    }
};

// Экспорт в JSON (для резервного копирования)
const exportToJSON = async (req, res) => {
    try {
        const userId = req.userId;
        const { start_date, end_date } = req.query;

        let query = `
      SELECT 
        id,
        item_name,
        price,
        category,
        purchase_date,
        created_at
      FROM purchases 
      WHERE user_id = ? 
    `;

        const params = [userId];

        if (start_date) {
            query += ' AND purchase_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND purchase_date <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY purchase_date DESC';

        const [purchases] = await pool.execute(query, params);

        if (purchases.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Нет данных для экспорта'
            });
        }

        // Создаём структурированный JSON
        const exportData = {
            meta: {
                exported_at: new Date().toISOString(),
                user_id: userId,
                record_count: purchases.length,
                format: 'expense-tracker-v1'
            },
            data: purchases
        };

        const today = new Date().toISOString().split('T')[0];
        const filename = `мои_покупки_${today}.json`;

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(JSON.stringify(exportData, null, 2));

    } catch (error) {
        console.error('Ошибка при экспорте в JSON:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при экспорте данных'
        });
    }
};

module.exports = { exportToCSV, exportToJSON };