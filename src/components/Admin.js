import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const Admin = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [premiumRequests, setPremiumRequests] = useState([]); // Стан для заявок на Premium
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        API.get('/users/me').then(res => {
            setCurrentUser(res.data);
            if (res.data.email === 'stepavoloshyn27@gmail.com' || res.data.role === 'Admin' || res.data.role === 'Moderator') {
                fetchData();
            } else {
                setLoading(false);
            }
        }).catch(() => setLoading(false));
    }, []);

    const fetchData = async () => {
        try { const pRes = await API.get('/posts'); setPosts(Array.isArray(pRes.data) ? pRes.data : []); } catch (e) {}
        try { const uRes = await API.get('/users/all'); setUsers(Array.isArray(uRes.data) ? uRes.data : []); } catch (e) {}
        try { 
            // Завантажуємо заявки на Premium
            const reqRes = await API.get('/payments/pending'); 
            setPremiumRequests(Array.isArray(reqRes.data) ? reqRes.data : []); 
        } catch (e) {}
        
        setLoading(false);
    };

    const handleDeletePost = async (id) => {
        if (!window.confirm("Точно видалити пост?")) return;
        try { await API.delete(`/posts/${id}`); setPosts(posts.filter(p => p.id !== id)); } catch (e) {}
    };

    const handleBan = async (id, currentStatus) => {
        const action = currentStatus ? "РОЗБЛОКУВАТИ" : "ЗАБЛОКУВАТИ";
        if (!window.confirm(`Точно ${action} користувача?`)) return;
        try {
            await API.post(`/users/${id}/ban`, !currentStatus, { headers: { 'Content-Type': 'application/json' } });
            setUsers(users.map(u => u.id === id ? { ...u, isBanned: !currentStatus } : u));
        } catch (e) { alert("Помилка. Можливо, у вас немає прав Адміна."); }
    };

    const handleWarn = async (id) => {
        if (!window.confirm("Видати попередження (Warn)? 3 попередження = Автобан!")) return;
        try {
            const res = await API.post(`/users/${id}/warn`);
            setUsers(users.map(u => u.id === id ? { ...u, warnings: res.data.warnings, isBanned: res.data.isBanned } : u));
        } catch (e) {}
    };

    const handleRemoveWarn = async (userId) => {
        try {
            const response = await API.post(`/users/${userId}/remove-warn`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, warnings: response.data.warnings } : u));
        } catch (error) {
            console.error("Помилка при знятті варна:", error);
            alert("Не вдалося зняти варн");
        }
    };

    const handleRole = async (id, currentRole) => {
        const newRole = currentRole === 'Moderator' ? 'User' : 'Moderator';
        if (!window.confirm(`Змінити роль на ${newRole}?`)) return;
        try {
            await API.post(`/users/${id}/promote`, `"${newRole}"`, { headers: { 'Content-Type': 'application/json' } });
            setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
        } catch (e) { alert("Помилка. Тільки Адмін може видавати ролі."); }
    };

    // НОВА ФУНКЦІЯ: Підтвердження оплати
    const handleApprovePremium = async (id) => {
        if (!window.confirm("Ви перевірили оплату на банці? Видати Premium?")) return;
        try {
            await API.post(`/payments/approve/${id}`);
            // Видаляємо заявку зі списку після успішного підтвердження
            setPremiumRequests(premiumRequests.filter(req => req.id !== id));
            alert("Premium успішно активовано!");
        } catch (e) {
            alert("Помилка підтвердження оплати.");
        }
    };

    if (loading) return <div style={{ color: '#8b949e', textAlign: 'center', padding: '50px' }}>Перевірка прав...</div>;
    if (!currentUser || (currentUser.email !== 'stepavoloshyn27@gmail.com' && currentUser.role !== 'Admin' && currentUser.role !== 'Moderator')) {
        return <div style={{ color: '#ef4444', textAlign: 'center', padding: '100px', fontSize: '24px', fontWeight: 'bold' }}>⛔ Доступ заборонено.</div>;
    }

    const isAdmin = currentUser.email === 'stepavoloshyn27@gmail.com' || currentUser.role === 'Admin';

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', color: '#c9d1d9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #30363d', paddingBottom: '15px' }}>
                <span style={{ fontSize: '32px' }}>🛡️</span>
                <h1 style={{ margin: 0, color: '#fff' }}>Панель Управління</h1>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('users')} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'users' ? '#3b82f6' : '#21262d', color: '#fff', border: 'none' }}>
                    👥 Користувачі ({users.length})
                </button>
                <button onClick={() => setActiveTab('posts')} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'posts' ? '#8a2be2' : '#21262d', color: '#fff', border: 'none' }}>
                    📝 Пости ({posts.length})
                </button>
                {/* НОВА ВКЛАДКА ДЛЯ PREMIUM */}
                {isAdmin && (
                    <button onClick={() => setActiveTab('premium')} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', background: activeTab === 'premium' ? '#38bdf8' : '#21262d', color: activeTab === 'premium' ? '#000' : '#38bdf8', border: '1px solid #38bdf8' }}>
                        💎 Заявки Premium ({premiumRequests.length})
                    </button>
                )}
            </div>
            
            <div style={{ background: '#161b22', padding: '25px', borderRadius: '12px', marginTop: '15px', border: '1px solid #30363d' }}>
                
                {/* ТАБ: ПОЛЬЗОВАТЕЛИ */}
                {activeTab === 'users' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {users.map(u => (
                            <div key={u.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', background: u.isBanned ? 'rgba(239, 68, 68, 0.15)' : '#0d1117', padding: '15px', borderRadius: '8px', border: u.isBanned ? '1px solid #ef4444' : '1px solid #21262d' }}>
                                <div>
                                    <strong style={{ color: u.isPremium ? '#38bdf8' : (u.isBanned ? '#ef4444' : '#fff'), fontSize: '18px' }}>
                                        {u.userName} {u.isVerified && '✔️'} {u.role === 'Moderator' && '🛡️'} {u.email === 'stepavoloshyn27@gmail.com' && '👑'} {u.isBanned && '(Забанений)'}
                                    </strong>
                                    <div style={{ fontSize: '14px', color: '#8b949e', marginTop: '4px' }}>Пошта: {u.email}</div>
                                    <div style={{ fontSize: '13px', color: '#fbbf24', marginTop: '4px', fontWeight: 'bold' }}>⚠️ Попереджень (Варнів): {u.warnings || 0} / 3</div>
                                </div>
                                
                                {u.email !== 'stepavoloshyn27@gmail.com' && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                                        <button onClick={() => handleWarn(u.id)} style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            Дати Варн
                                        </button>
                                        <button onClick={() => handleRemoveWarn(u.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            Зняти Варн
                                        </button>
                                        
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => handleRole(u.id, u.role)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    {u.role === 'Moderator' ? 'Зняти Модера' : 'Дати Модера'}
                                                </button>
                                                <button onClick={() => handleBan(u.id, u.isBanned)} style={{ background: u.isBanned ? '#10b981' : '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    {u.isBanned ? 'Розбанити' : 'Забанити'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ТАБ: ПОСТЫ */}
                {activeTab === 'posts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {posts.map(post => (
                            <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', padding: '15px', borderRadius: '8px', border: '1px solid #21262d' }}>
                                <div style={{ overflow: 'hidden', paddingRight: '15px' }}>
                                    <strong style={{ color: '#58a6ff', fontSize: '16px' }}>{post.author}</strong>
                                    <div style={{ fontSize: '14px', color: '#c9d1d9', marginTop: '6px' }}>{post.content ? post.content : '[Медіафайл]'}</div>
                                </div>
                                <button onClick={() => handleDeletePost(post.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Видалити
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ТАБ: ЗАЯВКИ НА ПРЕМІУМ */}
                {activeTab === 'premium' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {premiumRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#8b949e', padding: '40px' }}>
                                Немає нових заявок на Premium.
                            </div>
                        ) : (
                            premiumRequests.map(req => (
                                <div key={req.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', padding: '15px', borderRadius: '8px', border: '1px solid #38bdf8' }}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <strong style={{ color: '#fff', fontSize: '18px' }}>{req.userName}</strong>
                                        <div style={{ fontSize: '14px', color: '#8b949e', marginTop: '4px' }}>Пошта: {req.userEmail}</div>
                                        <div style={{ fontSize: '15px', color: '#38bdf8', marginTop: '6px', fontWeight: 'bold' }}>Очікує оплати: {req.amount} грн</div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Створено: {new Date(req.createdAt).toLocaleString()}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleApprovePremium(req.id)} 
                                        style={{ background: 'linear-gradient(135deg, #38bdf8, #2563eb)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(56, 189, 248, 0.3)' }}
                                    >
                                        ✅ Підтвердити Оплату
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Admin;