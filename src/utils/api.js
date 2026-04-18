import axios from 'axios';

// Використовуємо HTTP порт 5258
const API = axios.create({
    baseURL: 'http://localhost:5258/api',
});

API.interceptors.request.use((req) => {
    const token = sessionStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

// Додаємо обробку помилки 401 (якщо токен протух - викидаємо на логін)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            sessionStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default API;