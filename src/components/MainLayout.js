import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { normalizeLang } from '../utils/language';
import { UI_TEXT } from '../App'; 
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon, 
  ShieldCheckIcon, 
  LogOutIcon,
  SparklesIcon // <--- Додав нову іконку для Premium
} from '@heroicons/react/24/outline';

const MainLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [premiumGlow, setPremiumGlow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Легка анімація для кнопки Premium
    const interval = setInterval(() => setPremiumGlow(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-layout">
      {/* Бічне меню (Sidebar) */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Signal</h1>
        </div>

       <nav className="sidebar-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <HomeIcon className="icon" style={{ width: '24px', marginRight: '10px' }} />
            <span>Стрічка</span>
          </Link>

          <Link to="/messages" className={`nav-link ${isActive('/messages') ? 'active' : ''}`}>
            <ChatBubbleLeftRightIcon className="icon" style={{ width: '24px', marginRight: '10px' }} />
            <span>Повідомлення</span>
          </Link>

          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
            <UserIcon className="icon" style={{ width: '24px', marginRight: '10px' }} />
            <span>Профіль</span>
          </Link>

          {/* МАГІЯ ТУТ: Кнопка Premium */}
          <Link 
            to="/premium" 
            className={`nav-link ${isActive('/premium') ? 'active' : ''}`}
            style={{
               transition: '0.3s',
               textShadow: premiumGlow ? '0 0 10px rgba(56, 189, 248, 0.5)' : 'none'
            }}
          >
            <SparklesIcon className="icon" style={{ width: '24px', marginRight: '10px', color: '#38bdf8' }} />
            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Premium</span>
          </Link>

          {/* Кнопка з'являється тільки для Адміна */}
          {user && user.role === 'Admin' && (
            <Link to="/admin" className={`nav-link admin-link ${isActive('/admin') ? 'active' : ''}`}>
              <ShieldCheckIcon className="icon text-red-500" style={{ width: '24px', marginRight: '10px' }} />
              <span className="font-bold text-red-500">Адмінка</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <img src={user.avatarUrl || '/default-avatar.png'} alt="avatar" />
              <div className="user-details">
                <p className="username">{user.userName}</p>
                <p className="role">{user.role}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <span>Вийти</span>
          </button>
        </div>
      </aside>

      {/* Основний контент */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;