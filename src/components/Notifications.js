import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { normalizeLang } from '../utils/language';

const UI_TEXT = {
    uk: {
        title: 'Сповіщення',
        empty: 'У вас поки немає сповіщень.',
        clearAll: 'Очистити все',
        markRead: 'Прочитано',
        loading: 'Завантаження...',
        followMessage: 'підписався на вас',
        likeMessage: 'поставив лайк вашому посту',
        commentMessage: 'залишив коментар'
    },
    en: {
        title: 'Notifications',
        empty: 'No notifications yet.',
        clearAll: 'Clear all',
        markRead: 'Mark as read',
        loading: 'Loading...',
        followMessage: 'followed you',
        likeMessage: 'liked your post',
        commentMessage: 'commented on your post'
    }
};

const Notifications = ({ language = 'uk' }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentLanguage = normalizeLang(language);
    const text = UI_TEXT[currentLanguage] || UI_TEXT.uk;

    const fetchNotifications = async () => {
        try {
            const res = await API.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Помилка завантаження сповіщень", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.post(`/notifications/${id}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        if (!window.confirm(text.clearAll + "?")) return;
        try {
            await API.delete('/notifications/clear-all');
            setNotifications([]);
        } catch (err) {
            console.error(err);
        }
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (/^https?:\/\//i.test(url)) return url;
        const serverUrl = API.defaults.baseURL.replace(/\/api\/?$/, '');
        return `${serverUrl}${url}`;
    };

    if (loading) return <div style={{ color: '#8b949e', textAlign: 'center', padding: '20px' }}>{text.loading}</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#fff', margin: 0 }}>🔔 {text.title}</h2>
                {notifications.length > 0 && (
                    <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>
                        {text.clearAll}
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8b949e', padding: '40px', background: '#161b22', borderRadius: '12px' }}>
                    {text.empty}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.map(n => (
                        <div 
                            key={n.id} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '15px', 
                                padding: '15px', 
                                background: n.isRead ? '#0d1117' : '#1c2128', 
                                borderRadius: '12px', 
                                border: n.isRead ? '1px solid #30363d' : '1px solid #3b82f6',
                                transition: '0.2s'
                            }}
                        >
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#30363d', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {n.senderAvatar ? (
                                    <img src={getMediaUrl(n.senderAvatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ color: '#fff' }}>{n.senderName?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ color: '#fff', fontSize: '14px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#58a6ff' }}>{n.senderName}</span> {n.message}
                                </div>
                                <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '4px' }}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </div>
                            </div>

                            {!n.isRead && (
                                <button 
                                    onClick={() => markAsRead(n.id)} 
                                    style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                                >
                                    {text.markRead}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;