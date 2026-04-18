import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const Register = () => {
    const [formData, setFormData] = useState({ userName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', formData);
            
            // Використовуємо sessionStorage, щоб пустило в систему
            sessionStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: res.data.id,
                userName: res.data.userName,
                role: res.data.role
            }));
            
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Помилка реєстрації');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Створити акаунт</h2>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form className="auth-form" onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        className="auth-input"
                        placeholder="Ім'я користувача" 
                        onChange={(e) => setFormData({...formData, userName: e.target.value})} 
                        required 
                    />
                    <input 
                        type="email" 
                        className="auth-input"
                        placeholder="Email" 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    <input 
                        type="password" 
                        className="auth-input"
                        placeholder="Пароль" 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        required 
                    />
                    <button type="submit" className="btn-primary">Зареєструватися</button>
                </form>

                <div className="auth-footer">
                    Вже є акаунт? <Link to="/login" className="auth-link">Увійти</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;