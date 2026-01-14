// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Импортируем маршруты
const authRoutes = require('./routes/authRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const statsRoutes = require('./routes/statsRoutes');
const importExportRoutes = require('./routes/importExportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключаем маршруты
app.use('/api/auth', authRoutes);     // Все пути начинающиеся с /api/auth
app.use('/api/purchases', purchaseRoutes); // Все пути начинающиеся с /api/purchases
app.use('/api/stats', statsRoutes);
app.use('/api/import-export', importExportRoutes);

// Тестовые маршруты
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Сервер работает!' });
});

app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./database/db');
        const [rows] = await pool.execute('SELECT 1 + 1 AS result');
        res.json({
            success: true,
            message: 'Подключение к БД успешно!',
            result: rows[0].result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Ошибка подключения к БД',
            error: error.message
        });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`📡 API доступно по адресу: http://localhost:${PORT}/api`);
});