import React, { useState } from 'react';
import API from '../utils/api';

const PremiumStore = () => {
    const [step, setStep] = useState(1); // 1: Інфо, 2: Оплата
    const [loading, setLoading] = useState(false);
    
    // ТУТ ВСТАВ ПОСИЛАННЯ НА СВОЮ БАНКУ МОНОБАНК:
    const MONO_BANKA_URL = "https://send.monobank.ua/jar/6GKxnfhyxX"; 

    const handleStartPayment = async () => {
        setLoading(true);
        try {
            // Створюємо заявку зі статусом "Pending" у твоїй базі
            await API.post('/payments/request');
            setStep(2); // Переходимо на крок оплати
        } catch (e) {
            alert("Помилка створення запиту. Спробуйте пізніше.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px' }}>
            <div className="feed-post-card" style={{ textAlign: 'center', border: '2px solid #38bdf8', padding: '40px' }}>
                {step === 1 ? (
                    <>
                        <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>💎</h1>
                        <h2 style={{ color: '#fff', marginBottom: '20px' }}>Signal Premium</h2>
                        
                        <ul style={{ textAlign: 'left', color: '#94a3b8', marginBottom: '30px', listStyle: 'none', padding: 0 }}>
                            <li style={{ marginBottom: '10px' }}>✅ <b>Синя галочка</b> поруч із ім'ям</li>
                            <li style={{ marginBottom: '10px' }}>🎨 <b>Блакитний колір</b> нікнейму</li>
                            <li style={{ marginBottom: '10px' }}>🚀 <b>Підтримка</b> розвитку проєкту</li>
                        </ul>

                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>
                            100 грн <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>/ назавжди</span>
                        </div>

                        <button 
                            onClick={handleStartPayment} 
                            disabled={loading}
                            className="btn-primary" 
                            style={{ width: '100%', padding: '15px' }}
                        >
                            {loading ? 'Зачекайте...' : 'Оформити Premium'}
                        </button>
                    </>
                ) : (
                    <>
                        <h2 style={{ color: '#fff', marginBottom: '15px' }}>Останній крок! 💳</h2>
                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', marginBottom: '25px' }}>
                            <p style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '15px' }}>
                                1. Натисніть на кнопку нижче (відкриється Monobank).
                            </p>
                            <p style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '15px' }}>
                                2. Оплатіть рівно <b>100 грн</b>.
                            </p>
                            <p style={{ color: '#fbbf24', margin: '0', fontSize: '15px', fontWeight: 'bold' }}>
                                3. ВАЖЛИВО: В коментарі до платежу напишіть ваш Нікнейм!
                            </p>
                        </div>
                        
                        <a 
                            href={MONO_BANKA_URL} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn-primary"
                            style={{ display: 'block', textDecoration: 'none', background: 'linear-gradient(135deg, #e11d48, #be123c)', padding: '15px' }}
                        >
                            Оплатити через Monobank
                        </a>
                        
                        <p style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
                            Після перевірки (зазвичай 5-10 хв) адміністратор активує ваш Premium статус.
                        </p>
                        
                        <button 
                            onClick={() => setStep(1)} 
                            style={{ background: 'none', border: 'none', color: '#64748b', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            Повернутися назад
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PremiumStore;