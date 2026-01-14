// backend/controllers/authController.js
const pool = require('../database/db'); // импортируем наше подключение к БД
const bcrypt = require('bcryptjs'); // для шифрования паролей
const jwt = require('jsonwebtoken'); // для создания токенов

// Функция для регистрации нового пользователя
const register = async (req, res) => {
  try {
    // 1. Получаем данные из запроса
    const { username, email, password } = req.body;
    
    // 2. Проверяем, что все поля заполнены
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны для заполнения'
      });
    }
    
    // 3. Проверяем, нет ли уже такого пользователя
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Пользователь с таким email или именем уже существует'
      });
    }
    
    // 4. Шифруем пароль
    const salt = await bcrypt.genSalt(10); // "соль" для шифрования
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 5. Сохраняем пользователя в БД
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    // 6. Генерируем JWT токены
    const accessToken = jwt.sign(
      { userId: result.insertId }, // что кладём в токен
      process.env.JWT_SECRET, // секретный ключ из .env
      { expiresIn: '15m' } // срок жизни 15 минут
    );
    
    const refreshToken = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + 'refresh',
      { expiresIn: '7d' } // срок жизни 7 дней
    );
    
    // 7. Сохраняем refresh token в БД
    await pool.execute(
      'INSERT INTO user_tokens (user_id, refresh_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [result.insertId, refreshToken]
    );
    
    // 8. Отправляем успешный ответ
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      data: {
        user: {
          id: result.insertId,
          username,
          email
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer'
        }
      }
    });
    
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    });
  }
};

// Функция для входа пользователя
const login = async (req, res) => {
  try {
    // 1. Получаем данные из запроса
    const { email, password } = req.body;
    
    // 2. Проверяем, что все поля заполнены
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }
    
    // 3. Ищем пользователя в БД
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    const user = users[0];
    
    // 4. Проверяем пароль (сравниваем хэши)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }
    
    // 5. Генерируем JWT токены
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + 'refresh',
      { expiresIn: '7d' }
    );
    
    // 6. Сохраняем refresh token в БД
    await pool.execute(
      'INSERT INTO user_tokens (user_id, refresh_token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
      [user.id, refreshToken]
    );
    
    // 7. Отправляем успешный ответ
    res.status(200).json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer'
        }
      }
    });
    
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    });
  }
};

// Экспортируем функции, чтобы использовать в маршрутах
module.exports = {
  register,
  login
};