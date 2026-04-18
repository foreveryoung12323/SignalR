import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ВХІД ЧЕРЕЗ GOOGLE
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await api.post('/auth/google', {
        email: result.user.email,
        name: result.user.displayName,
        picture: result.user.photoURL,
        token: idToken
      });

      const { token, role, userName, id } = response.data;
      sessionStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id, userName, role }));

      if (role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('Помилка при вході через Google');
    }
  };

  // ВХІД ЧЕРЕЗ EMAIL
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, role, userName, id } = response.data;
      sessionStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id, userName, role }));

      if (role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Невірна пошта або пароль');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Вхід у Signal</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleEmailLogin}>
          <input 
            type="email" 
            className="auth-input"
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            className="auth-input"
            placeholder="Пароль" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="btn-primary">Увійти</button>
        </form>

        <div className="auth-divider">або</div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          Увійти через Google
        </button>

        <div className="auth-footer">
          Немає акаунту? <Link to="/register" className="auth-link">Зареєструватися</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;