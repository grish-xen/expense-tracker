-- 1. Добавляем пользователя (пароль: 'password123')
INSERT INTO users (username, email, password_hash) 
VALUES ('test_user', 'test@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMy.MH.3sY2W2xZ3q5Q5t7ZfGqVYJ1qLdW6');

-- 2. Добавляем категории по умолчанию
INSERT INTO default_categories (name, color, icon) VALUES
('Продукты', '#2ecc71', 'shopping-basket'),
('Транспорт', '#3498db', 'car'),
('Кафе', '#e74c3c', 'coffee'),
('Развлечения', '#9b59b6', 'film'),
('Здоровье', '#1abc9c', 'heart'),
('Одежда', '#f39c12', 'tshirt'),
('Другое', '#95a5a6', 'ellipsis-h');

-- 3. Добавляем тестовые покупки
INSERT INTO purchases (user_id, item_name, price, category, purchase_date) VALUES
(1, 'Хлеб', 65.00, 'Продукты', '2024-01-15'),
(1, 'Молоко', 85.50, 'Продукты', '2024-01-15'),
(1, 'Проездной', 1200.00, 'Транспорт', '2024-01-14'),
(1, 'Кофе в Starbucks', 250.00, 'Кафе', '2024-01-13'),
(1, 'Кино', 500.00, 'Развлечения', '2024-01-12'),
(1, 'Витамины', 350.00, 'Здоровье', '2024-01-11');