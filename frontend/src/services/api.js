import axios from 'axios';

// Базовый URL нашего API
const API_URL = 'http://localhost:5000/api';

// Создаём экземпляр axios с настройками
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Перехватчик для добавления токена к каждому запросу
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Перехватчик для обработки ошибок (например, истёкший токен)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если ошибка 401 (не авторизован) и это не запрос на обновление токена
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Пытаемся обновить токен
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                const { access_token, refresh_token } = response.data.data.tokens;
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);

                // Повторяем оригинальный запрос с новым токеном
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Если не удалось обновить токен, перенаправляем на страницу входа
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Функции для работы с API
export const authService = {
    // Регистрация
    register: (userData) => api.post('/auth/register', userData),

    // Вход
    login: (credentials) => api.post('/auth/login', credentials),

    // Выход
    logout: () => api.post('/auth/logout')
};

export const purchaseService = {
    // Получить все покупки
    getPurchases: (params) => api.get('/purchases', { params }),

    // Добавить покупку
    addPurchase: (data) => api.post('/purchases', data),

    // Удалить покупку
    deletePurchase: (id) => api.delete(`/purchases/${id}`),

    // Обновить покупку
    updatePurchase: (id, data) => api.put(`/purchases/${id}`)
};

export const statsService = {
    // Статистика по категориям
    getStatsByCategory: (params) => api.get('/stats/by-category', { params }),

    // Общая сводка
    getSummary: (params) => api.get('/stats/summary', { params })
};

export const importExportService = {
    // Экспорт в CSV
    exportCSV: (params) => api.get('/import-export/export/csv', {
        params,
        responseType: 'blob' // Важно для скачивания файла!
    }),

    // Экспорт в JSON
    exportJSON: (params) => api.get('/import-export/export/json', {
        params,
        responseType: 'blob'
    }),

    // Импорт из CSV
    importCSV: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/import-export/import/csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

export default api;