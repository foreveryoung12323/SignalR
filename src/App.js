import React, { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import Feed from './components/Feed';
import Profile from './components/Profile';
import Messages from './components/Messages';
import Login from './components/Login';
import Register from './components/Register';
import Admin from './components/Admin';
import PremiumStore from './components/PremiumStore'; // <-- ДОДАНО
import Notifications from './components/Notifications'; // <-- ДОДАНО
import API from './utils/api';
import { LANGUAGE_LABELS, getSavedLanguage, normalizeLang } from './utils/language';
import './App.css';

const UI_TEXT = {
  uk: {
    feed: '🏠 Стрічка',
    messages: '💬 Повідомлення',
    notifications: '🔔 Сповіщення', // <-- ДОДАНО
    profile: '👤 Профіль',
    premium: '💎 Premium', // <-- ДОДАНО
    admin: '👑 Адмінка',
    lightTheme: '☀️ Світла тема',
    darkTheme: '🌙 Темна тема',
    logout: '🚪 Вийти'
  },
  en: {
    feed: '🏠 Feed',
    messages: '💬 Messages',
    notifications: '🔔 Notifications', // <-- ДОДАНО
    profile: '👤 Profile',
    premium: '💎 Premium', // <-- ДОДАНО
    admin: '👑 Admin',
    lightTheme: '☀️ Light theme',
    darkTheme: '🌙 Dark theme',
    logout: '🚪 Sign out'
  }
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark');
  const [language, setLanguage] = useState(getSavedLanguage);

  const currentLanguage = normalizeLang(language);
  const text = UI_TEXT[currentLanguage] || UI_TEXT.uk;

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      API.get('/users/me')
        .then(res => setCurrentUser(res.data))
        .catch(err => {
          setCurrentUser(null);
          
          // ЖОРСТКИЙ КОНТРОЛЬ: Якщо токен недійсний або юзер ЗАБАНЕНИЙ
          if (err.response && (err.response.status === 403 || err.response.status === 401)) {
            sessionStorage.removeItem('token');
            setIsAuthenticated(false);
            alert(err.response.data?.message || "Ваш доступ обмежено. Будь ласка, увійдіть знову.");
          }
        });

      // ПІНГ ОНЛАЙНУ: Щоразу в мережі!
      const pingOnline = () => API.post('/chats/ping').catch(() => {});
      pingOnline(); // Відразу при вході
      const interval = setInterval(pingOnline, 60000); // Кожну хвилину
      return () => clearInterval(interval);
    } else {
      setCurrentUser(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.body.className = `${theme}-theme`;
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app-lang', currentLanguage);
  }, [currentLanguage]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app-layout">
      {isAuthenticated && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1 className="brand-logo">Signal</h1>
            <select className="feed-select sidebar-language-select" value={currentLanguage} onChange={(e) => setLanguage(e.target.value)}>
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>{text.feed}</NavLink>
            <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>{text.messages}</NavLink>
            
            {/* НОВІ КНОПКИ ТУТ */}
            <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>{text.notifications}</NavLink>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>{text.profile}</NavLink>
            
            <NavLink to="/premium" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} style={{ color: '#38bdf8', fontWeight: 'bold' }}>
              {text.premium}
            </NavLink>

            {currentUser && (currentUser.email === 'stepavoloshyn27@gmail.com' || currentUser.role === 'Admin' || currentUser.role === 'Moderator') && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} style={{ color: '#ef4444' }}>
                {text.admin}
              </NavLink>
            )}
          </nav>

          <div className="sidebar-footer">
            <button onClick={toggleTheme} className="nav-link theme-btn">{theme === 'dark' ? text.lightTheme : text.darkTheme}</button>
            <button onClick={handleLogout} className="nav-link logout-btn">{text.logout}</button>
          </div>
        </aside>
      )}

      <main className={`main-content ${!isAuthenticated ? 'full-width' : ''}`}>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} language={currentLanguage} setLanguage={setLanguage} />} />
              <Route path="/register" element={<Register language={currentLanguage} setLanguage={setLanguage} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Feed language={currentLanguage} setLanguage={setLanguage} />} />
              <Route path="/profile" element={<Profile language={currentLanguage} />} />
              <Route path="/messages" element={<Messages language={currentLanguage} />} />
              
              {/* НОВІ МАРШРУТИ ТУТ */}
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/premium" element={<PremiumStore />} />
              
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;