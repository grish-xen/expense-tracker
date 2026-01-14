// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  try {
    // 1. Получаем токен из заголовка Authorization
    const authHeader = req.headers['authorization'];
    
    // Ожидаем заголовок вида: "Bearer eyJhbGciOiJIUzI1NiIs..."
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен доступа отсутствует'
      });
    }
    
    // 2. Проверяем токен с помощью секретного ключа
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return res.status(403).json({
          success: false,
          message: 'Недействительный или просроченный токен'
        });
      }
      
      // 3. Если токен валиден, добавляем ID пользователя в запрос
      req.userId = decoded.userId;
      
      // 4. Передаём управление следующему обработчику
      next();
    });
    
  } catch (error) {
    console.error('Ошибка в authMiddleware:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при проверке токена'
    });
  }
};

module.exports = { authenticateToken };