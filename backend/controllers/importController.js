const pool = require('../database/db');
const csv = require('csv-parser');
const stream = require('stream');

// Импорт из CSV файла
const importFromCSV = async (req, res) => {
    try {
        const userId = req.userId;

        // Проверяем, что файл был загружен
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Файл не был загружен'
            });
        }

        const results = [];
        const errors = [];

        // Создаём поток для чтения CSV
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        // Парсим CSV
        await new Promise((resolve, reject) => {
            bufferStream
                .pipe(csv())
                .on('data', (data) => {
                    results.push(data);
                })
                .on('end', () => {
                    resolve();
                })
                .on('error', (error) => {
                    reject(error);
                });
        });

        // Проверяем обязательные поля
        const requiredFields = ['Название', 'Цена', 'Категория'];
        const validRows = [];

        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNumber = i + 2; // +2 потому что заголовок + нумерация с 1

            // Проверяем обязательные поля
            const missingFields = requiredFields.filter(field => !row[field]);

            if (missingFields.length > 0) {
                errors.push(`Строка ${rowNumber}: отсутствуют поля: ${missingFields.join(', ')}`);
                continue;
            }

            // Проверяем, что цена - число
            const price = parseFloat(row['Цена']);
            if (isNaN(price)) {
                errors.push(`Строка ${rowNumber}: цена "${row['Цена']}" не является числом`);
                continue;
            }

            // Форматируем дату
            let purchaseDate = row['Дата'] || new Date().toISOString().split('T')[0];

            // Пытаемся разобрать разные форматы дат
            if (purchaseDate) {
                const date = new Date(purchaseDate);
                if (isNaN(date.getTime())) {
                    purchaseDate = new Date().toISOString().split('T')[0];
                } else {
                    purchaseDate = date.toISOString().split('T')[0];
                }
            }

            validRows.push({
                item_name: row['Название'],
                price: price,
                category: row['Категория'],
                purchase_date: purchaseDate
            });
        }

        // Если есть ошибки, возвращаем их
        if (errors.length > 0 && validRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Ошибки в файле',
                errors: errors
            });
        }

        // Вставляем данные в БД
        const insertedRows = [];

        for (const row of validRows) {
            try {
                const [result] = await pool.execute(
                    `INSERT INTO purchases (user_id, item_name, price, category, purchase_date) 
           VALUES (?, ?, ?, ?, ?)`,
                    [userId, row.item_name, row.price, row.category, row.purchase_date]
                );

                insertedRows.push({
                    id: result.insertId,
                    ...row
                });
            } catch (dbError) {
                errors.push(`Ошибка БД при импорте "${row.item_name}": ${dbError.message}`);
            }
        }

        res.json({
            success: true,
            message: 'Импорт завершён',
            summary: {
                total_rows: results.length,
                imported: insertedRows.length,
                failed: errors.length
            },
            imported: insertedRows,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Ошибка при импорте из CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при импорте данных',
            error: error.message
        });
    }
};

// Импорт из JSON
const importFromJSON = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Файл не был загружен'
            });
        }

        const fileContent = req.file.buffer.toString('utf8');
        let importData;

        try {
            importData = JSON.parse(fileContent);
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                message: 'Неверный формат JSON файла'
            });
        }

        // Поддерживаем два формата:
        // 1. Наш экспортированный формат с метаданными
        // 2. Простой массив покупок
        const purchases = importData.data || importData;

        if (!Array.isArray(purchases)) {
            return res.status(400).json({
                success: false,
                message: 'Файл должен содержать массив покупок'
            });
        }

        const errors = [];
        const insertedRows = [];

        for (const purchase of purchases) {
            // Проверяем обязательные поля
            if (!purchase.item_name || !purchase.price || !purchase.category) {
                errors.push(`Пропущены обязательные поля: ${JSON.stringify(purchase)}`);
                continue;
            }

            const price = parseFloat(purchase.price);
            if (isNaN(price)) {
                errors.push(`Неверная цена: ${purchase.price}`);
                continue;
            }

            try {
                const [result] = await pool.execute(
                    `INSERT INTO purchases (user_id, item_name, price, category, purchase_date) 
           VALUES (?, ?, ?, ?, ?)`,
                    [
                        userId,
                        purchase.item_name,
                        price,
                        purchase.category,
                        purchase.purchase_date || new Date().toISOString().split('T')[0]
                    ]
                );

                insertedRows.push({
                    id: result.insertId,
                    ...purchase
                });
            } catch (dbError) {
                errors.push(`Ошибка БД: ${dbError.message}`);
            }
        }

        res.json({
            success: true,
            message: 'Импорт из JSON завершён',
            summary: {
                total_rows: purchases.length,
                imported: insertedRows.length,
                failed: errors.length
            },
            imported: insertedRows,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Ошибка при импорте из JSON:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при импорте данных'
        });
    }
};

module.exports = { importFromCSV, importFromJSON };