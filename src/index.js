import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // ДОДАЛИ ЦЕЙ ІМПОРТ
import App from './App';
import './i18n'; // Твій файл перекладів

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // ОБГОРТАЄМО ДОДАТОК У ROUTER
  <BrowserRouter>
    <App />
  </BrowserRouter>
);