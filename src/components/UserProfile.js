import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../utils/api';
import { normalizeLang } from '../utils/language';

const UI_TEXT = {
    uk: {
        loading: 'Завантаження профілю...',
        follow: 'Підписатися',
        unfollow: 'Відписатися',
        followers: 'Підписники',
        following: 'Підписки',
        posts: 'Пости',
        error: 'Користувача не знайдено',
        self: 'Це ви'
    },
    en: {
        loading: 'Loading profile...',
        follow: 'Follow',
        unfollow: 'Unfollow',
        followers: 'Followers',
        following: 'Following',
        posts: 'Posts',
        error: 'User not found',
        self: 'It is you'
    }
};

const UserProfile = ({ language = 'uk' }) => {
    const { id } = useParams(); // Отримуємо ID користувача з URL
    const [user, setUser] = useState(null);
    const [myId, setMyId] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [loading, setLoading] = useState(true);

    const currentLanguage = normalizeLang(language);
    const text = UI_TEXT[currentLanguage] || UI_TEXT.uk;

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                // 1. Отримуємо дані користувача
                const userRes = await API.get(`/users/${id}`);
                setUser(userRes.data);

                // 2. Отримуємо мій ID (щоб не підписуватися на себе)
                const meRes = await API.get('/users/me');
                setMyId(meRes.data.id);

                // 3. Перевіряємо статус підписки
                const statusRes = await API.get(`/follows/status/${id}`);
                setIsFollowing(statusRes.data.isFollowing);

                // 4. Отримуємо лічильники (можна додати метод на бекенд або порахувати масиви)
                const followersRes = await API.get(`/follows/followers/${id}`);
                const followingRes = await API.get(`/follows/following/${id}`);
                setStats({
                    followers: followersRes.data.length,
                    following: followingRes.data.length
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [id]);

    const handleFollowToggle = async () => {
        try {
            if (isFollowing) {
                await API.post(`/follows/unfollow/${id}`);
                setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
            } else {
                await API.post(`/follows/follow/${id}`);
                setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
            setIsFollowing(!isFollowing);
        } catch (err) {
            alert("Дія не вдалася");
        }
    };

    const getAvatarInitial = (name) => name?.charAt(0).toUpperCase() || '?';

    if (loading) return <div style={{ color: '#8b949e', textAlign: 'center', padding: '50px' }}>{text.loading}</div>;
    if (!user) return <div style={{ color: '#ef4444', textAlign: 'center', padding: '50px' }}>{text.error}</div>;

    const isMe = myId === parseInt(id);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', color: '#fff' }}>
            <div style={{ background: '#161b22', borderRadius: '16px', padding: '30px', border: '1px solid #30363d', textAlign: 'center' }}>
                
                {/* Аватар */}
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#3b82f6', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold' }}>
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : getAvatarInitial(user.userName)}
                </div>

                <h2 style={{ margin: '0 0 5px 0' }}>{user.userName}</h2>
                <p style={{ color: '#8b949e', margin: '0 0 20px 0' }}>{user.bio || 'No bio yet'}</p>

                {/* Статистика */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px' }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{stats.followers}</div>
                        <div style={{ color: '#8b949e', fontSize: '12px' }}>{text.followers}</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{stats.following}</div>
                        <div style={{ color: '#8b949e', fontSize: '12px' }}>{text.following}</div>
                    </div>
                </div>

                {/* Кнопка дії */}
                {!isMe ? (
                    <button 
                        onClick={handleFollowToggle}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            backgroundColor: isFollowing ? '#21262d' : '#fff',
                            color: isFollowing ? '#fff' : '#000',
                            border: isFollowing ? '1px solid #30363d' : 'none',
                            transition: '0.2s'
                        }}
                    >
                        {isFollowing ? text.unfollow : text.follow}
                    </button>
                ) : (
                    <div style={{ color: '#8b949e', fontSize: '14px', fontStyle: 'italic' }}>{text.self}</div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;