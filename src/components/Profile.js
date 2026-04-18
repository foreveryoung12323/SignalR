import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { getLocaleForLang, normalizeLang } from '../utils/language';

const UI_TEXT = {
    uk: {
        loading: 'Завантаження профілю...', loadError: 'Не вдалося завантажити профіль:', saveSuccess: 'Профіль успішно оновлено.',
        saveError: 'Не вдалося зберегти профіль.', userName: 'Ім’я користувача', bio: 'Про себе', bioPlaceholder: 'Розкажіть трохи про себе...',
        avatar: 'Змінити фото', save: 'Зберегти зміни', saving: 'Збереження...', myPosts: 'Мої публікації', noPosts: 'Ви ще нічого не публікували.',
        attachment: 'Вкладення', deleteProfileBtn: 'Видалити профіль', deleteProfileConfirm: 'Ви впевнені, що хочете видалити свій профіль назавжди?',
        comments: 'Коментарі', commentPlaceholder: 'Напишіть коментар...', noComments: 'Коментарів поки немає.', reactionsLabel: 'реакцій',
        deletePostConfirm: 'Видалити цей пост?', deleteLabel: 'Видалити', deleteCommentConfirm: 'Видалити цей коментар?',
        followers: 'Підписники', following: 'Підписки', postsCount: 'Публікації', emptyList: 'Список порожній',
        fileSelected: 'Файл обрано:'
    },
    en: {
        loading: 'Loading profile...', loadError: 'Could not load profile:', saveSuccess: 'Profile updated successfully.',
        saveError: 'Could not save the profile.', userName: 'Username', bio: 'About me', bioPlaceholder: 'Tell us a bit about yourself...',
        avatar: 'Change photo', save: 'Save changes', saving: 'Saving...', myPosts: 'My posts', noPosts: 'You have not published anything yet.',
        attachment: 'Attachment', deleteProfileBtn: 'Delete profile', deleteProfileConfirm: 'Are you sure you want to delete your profile permanently?',
        comments: 'Comments', commentPlaceholder: 'Write a comment...', noComments: 'No comments yet.', reactionsLabel: 'reactions',
        deletePostConfirm: 'Delete this post?', deleteLabel: 'Delete', deleteCommentConfirm: 'Delete this comment?',
        followers: 'Followers', following: 'Following', postsCount: 'Posts', emptyList: 'List is empty',
        fileSelected: 'File selected:'
    }
};

const getMediaUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const apiBaseUrl = API.defaults.baseURL || '';
    const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    return `${serverUrl}${url}`;
};

const isVideo = (url) => {
    if (!url) return false;
    return ['.mp4', '.webm', '.ogg', '.mov'].some((extension) => url.toLowerCase().endsWith(extension));
};

const Profile = ({ language = 'uk' }) => {
    const [user, setUser] = useState(null);
    const [myPosts, setMyPosts] = useState([]);
    const [newUserName, setNewUserName] = useState('');
    const [newBio, setNewBio] = useState('');
    const [newAvatar, setNewAvatar] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [likedPosts, setLikedPosts] = useState({});
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    const [newCommentText, setNewCommentText] = useState({});
    const [activeTab, setActiveTab] = useState('posts'); 
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

    const currentLanguage = normalizeLang(language);
    const text = UI_TEXT[currentLanguage] || UI_TEXT.uk;

    const fetchProfileData = async () => {
        try {
            const res = await API.get('/users/me');
            setUser(res.data);
            setNewUserName(res.data.userName || '');
            setNewBio(res.data.bio || '');

            const postsRes = await API.get('/posts/my');
            const loadedPosts = postsRes.data.reverse ? postsRes.data.reverse() : postsRes.data;
            setMyPosts(loadedPosts);

            const initialLikes = {};
            loadedPosts.forEach(post => {
                if (post.isLiked) initialLikes[post.id] = true;
            });
            setLikedPosts(initialLikes);

            const followersRes = await API.get(`/follows/followers/${res.data.id}`);
            const followingRes = await API.get(`/follows/following/${res.data.id}`);
            setFollowers(followersRes.data);
            setFollowing(followingRes.data);

        } catch (err) {
            console.error(text.loadError, err);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [text.loadError]);

    const handleSaveProfile = async (event) => {
        event.preventDefault();
        setIsSaving(true);
        const formData = new FormData();
        formData.append('userName', newUserName);
        if (newBio) formData.append('bio', newBio);
        if (newAvatar) formData.append('avatar', newAvatar);

        try {
            const res = await API.patch('/users/update-profile', formData);
            alert(text.saveSuccess);
            setUser((prevUser) => ({ ...prevUser, ...res.data }));
            setNewAvatar(null);
            fetchProfileData();
        } catch (err) {
            alert(text.saveError);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (!window.confirm(text.deleteProfileConfirm)) return;
        try {
            await API.delete('/users/me');
            sessionStorage.removeItem('token');
            window.location.href = '/login';
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm(text.deletePostConfirm)) return;
        try {
            await API.delete(`/posts/${postId}`);
            setMyPosts(myPosts.filter(p => p.id !== postId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        if (!window.confirm(text.deleteCommentConfirm)) return;
        try {
            await API.delete(`/posts/comments/${commentId}`);
            setComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleLike = async (postId) => {
        try {
            const res = await API.post(`/likes/${postId}`);
            const isLiked = res.data.liked;
            setLikedPosts((prev) => ({ ...prev, [postId]: isLiked }));
            setMyPosts((prevPosts) =>
                prevPosts.map((post) => post.id === postId ? { ...post, likesCount: isLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1) } : post)
            );
        } catch (err) {}
    };

    const toggleComments = async (postId) => {
        if (showComments[postId]) {
            setShowComments((prev) => ({ ...prev, [postId]: false }));
            return;
        }
        try {
            const response = await API.get(`/posts/${postId}/comments`);
            setComments((prev) => ({ ...prev, [postId]: response.data }));
        } catch (error) {
            setComments((prev) => ({ ...prev, [postId]: [] }));
        } finally {
            setShowComments((prev) => ({ ...prev, [postId]: true }));
        }
    };

    const handleSendComment = async (event, postId) => {
        event.preventDefault();
        if (!newCommentText[postId]?.trim()) return;

        try {
            const response = await API.post(`/posts/${postId}/comments`, { text: newCommentText[postId] });
            const newComment = response.data;
            if (!newComment.author) newComment.author = user?.userName || 'User';

            setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
            setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
        } catch (error) {
            console.error(error);
        }
    };

    if (!user) return <div style={{ textAlign: 'center', color: '#8b949e', marginTop: '50px' }}>{text.loading}</div>;

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px' }}>
            
            {user.warnings > 0 && (
                <div style={{ background: '#451a03', border: '1px solid #d97706', color: '#fbbf24', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span>
                    <div>
                        <strong style={{ fontSize: '16px' }}>Попередження від модератора!</strong>
                        <div style={{ fontSize: '14px', marginTop: '4px' }}>У вас <b>{user.warnings} з 3</b> попереджень.</div>
                    </div>
                </div>
            )}

            <div className="feed-post-card" style={{ padding: '30px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', marginBottom: '25px', flexWrap: 'wrap' }}>
                    {user.avatarUrl ? (
                        <img src={getMediaUrl(user.avatarUrl)} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3b82f6' }} />
                    ) : (
                        <div className="post-avatar" style={{ width: '100px', height: '100px', fontSize: '40px' }}>
                            {user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        {/* ТУТ: Преміум колір та Галочка в заголовку профілю */}
                        <h2 style={{ 
                            margin: '0 0 10px 0', 
                            color: user.isPremium ? '#38bdf8' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            {user.userName} 
                            {user.role === 'Moderator' && '🛡️'} 
                            {user.role === 'Admin' && '👑'}
                            {user.isVerified && <span title="Verified" style={{ color: '#38bdf8', fontSize: '18px' }}>✔️</span>}
                        </h2>
                        
                        <div style={{ display: 'flex', gap: '25px', marginBottom: '15px' }}>
                            <div onClick={() => setActiveTab('posts')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>{myPosts.length}</div>
                                <div style={{ color: '#8b949e', fontSize: '12px' }}>{text.postsCount}</div>
                            </div>
                            <div onClick={() => setActiveTab('followers')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>{followers.length}</div>
                                <div style={{ color: '#8b949e', fontSize: '12px' }}>{text.followers}</div>
                            </div>
                            <div onClick={() => setActiveTab('following')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>{following.length}</div>
                                <div style={{ color: '#8b949e', fontSize: '12px' }}>{text.following}</div>
                            </div>
                        </div>

                        <p style={{ margin: '5px 0', color: '#8b949e', fontSize: '14px' }}>{user.email}</p>
                        {user.bio && <p style={{ margin: 0, color: '#d1d5db', fontStyle: 'italic' }}>"{user.bio}"</p>}
                    </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', borderTop: '1px solid #30363d', paddingTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'end' }}>
                        <div>
                            <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '8px' }}>{text.userName}</label>
                            <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="auth-input" required />
                        </div>
                        
                        <div>
                            <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Фото профілю</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input 
                                    id="avatar-upload" 
                                    type="file" 
                                    onChange={(e) => setNewAvatar(e.target.files?.[0] || null)} 
                                    style={{ display: 'none' }} 
                                    accept="image/*" 
                                />
                                <label 
                                    htmlFor="avatar-upload" 
                                    style={{ 
                                        background: '#21262d', 
                                        color: '#c9d1d9', 
                                        border: '1px solid #30363d', 
                                        padding: '10px 16px', 
                                        borderRadius: '8px', 
                                        cursor: 'pointer', 
                                        fontSize: '13px', 
                                        fontWeight: 'bold',
                                        transition: '0.2s',
                                        display: 'inline-block'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = '#30363d'}
                                    onMouseOut={(e) => e.target.style.background = '#21262d'}
                                >
                                    📷 {text.avatar}
                                </label>
                                {newAvatar && <span style={{ fontSize: '11px', color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✅ {newAvatar.name}</span>}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ color: '#8b949e', fontSize: '13px', display: 'block', marginBottom: '8px' }}>{text.bio}</label>
                        <input type="text" value={newBio} onChange={(e) => setNewBio(e.target.value)} className="auth-input" placeholder={text.bioPlaceholder} />
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                            {isSaving ? text.saving : text.save}
                        </button>
                        <button type="button" onClick={handleDeleteProfile} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}>
                            {text.deleteProfileBtn}
                        </button>
                    </div>
                </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #30363d', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab('posts')} style={{ background: 'none', border: 'none', padding: '15px 30px', color: activeTab === 'posts' ? '#fff' : '#8b949e', borderBottom: activeTab === 'posts' ? '2px solid #fff' : 'none', cursor: 'pointer', fontWeight: 'bold' }}>{text.postsCount}</button>
                <button onClick={() => setActiveTab('followers')} style={{ background: 'none', border: 'none', padding: '15px 30px', color: activeTab === 'followers' ? '#fff' : '#8b949e', borderBottom: activeTab === 'followers' ? '2px solid #fff' : 'none', cursor: 'pointer', fontWeight: 'bold' }}>{text.followers}</button>
                <button onClick={() => setActiveTab('following')} style={{ background: 'none', border: 'none', padding: '15px 30px', color: activeTab === 'following' ? '#fff' : '#8b949e', borderBottom: activeTab === 'following' ? '2px solid #fff' : 'none', cursor: 'pointer', fontWeight: 'bold' }}>{text.following}</button>
            </div>

            <div>
                {activeTab === 'posts' && (
                    myPosts.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#8b949e', padding: '30px' }}>{text.noPosts}</div>
                    ) : (
                        myPosts.map((post) => {
                            const postComments = comments[post.id] || [];
                            return (
                                <div key={post.id} className="feed-post-card" style={{ padding: '25px', marginBottom: '25px' }}>
                                    <div className="post-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {user.avatarUrl ? (
                                                <img src={getMediaUrl(user.avatarUrl)} alt="Avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div className="post-avatar">{user.userName ? user.userName.charAt(0).toUpperCase() : 'U'}</div>
                                            )}
                                            <div style={{ textAlign: 'left' }}>
                                                {/* ТУТ: Колір та Галочка для автора (тебе) у списку постів */}
                                                <div className="post-author" style={{ 
                                                    color: user.isPremium ? '#38bdf8' : 'inherit',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    {user.userName}
                                                    {user.isVerified && <span title="Verified" style={{ color: '#38bdf8', fontSize: '12px' }}>✔️</span>}
                                                </div>
                                                <div className="post-date">{new Date(post.createdAt).toLocaleString(getLocaleForLang(currentLanguage))}</div>
                                            </div>
                                        </div>
                                        <button className="delete-btn" onClick={() => handleDeletePost(post.id)}>{text.deleteLabel}</button>
                                    </div>
                                    <div className="post-content">{post.content}</div>
                                    {post.imageUrl && (
                                        <div style={{ marginTop: '15px' }}>
                                            {isVideo(post.imageUrl) ? (
                                                <video src={getMediaUrl(post.imageUrl)} controls style={{ width: '100%', borderRadius: '12px', border: '1px solid #30363d' }} />
                                            ) : (
                                                <img src={getMediaUrl(post.imageUrl)} alt={text.attachment} style={{ width: '100%', borderRadius: '12px', border: '1px solid #30363d' }} />
                                            )}
                                        </div>
                                    )}
                                    <div className="post-stats">
                                        <span>{post.likesCount || 0} {text.reactionsLabel}</span>
                                    </div>
                                    <div className="post-actions-bar">
                                        <button className={`like-btn ${likedPosts[post.id] ? 'active' : ''}`} onClick={() => handleLike(post.id)}>
                                            {likedPosts[post.id] ? '❤️' : '🤍'} {post.likesCount || 0}
                                        </button>
                                        <button className={`comment-toggle-btn ${showComments[post.id] ? 'active' : ''}`} onClick={() => toggleComments(post.id)}>
                                            💬 {text.comments}
                                        </button>
                                    </div>
                                    {showComments[post.id] && (
                                        <div className="comments-section">
                                            <div className="comments-header">{text.comments}</div>
                                            <div className="comments-list">
                                                {postComments.length === 0 ? (
                                                    <div className="no-comments">{text.noComments}</div>
                                                ) : (
                                                    postComments.map((comment, index) => (
                                                        <div key={`${post.id}-${index}`} className="comment-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <div className="comment-item-header"><strong>{comment.author}</strong></div>
                                                                <div>{comment.text}</div>
                                                            </div>
                                                            <button onClick={() => handleDeleteComment(post.id, comment.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}>✕</button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <form className="comment-input-form" onSubmit={(event) => handleSendComment(event, post.id)}>
                                                <input className="comment-input" placeholder={text.commentPlaceholder} value={newCommentText[post.id] || ''} onChange={(e) => setNewCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))} />
                                                <button type="submit" className="comment-submit-btn">↗</button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )
                )}

                {(activeTab === 'followers' || activeTab === 'following') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(activeTab === 'followers' ? followers : following).length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#8b949e', padding: '30px' }}>{text.emptyList}</div>
                        ) : (
                            (activeTab === 'followers' ? followers : following).map(u => (
                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', background: '#161b22', borderRadius: '12px', border: '1px solid #30363d' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {u.avatarUrl ? (
                                            <img src={getMediaUrl(u.avatarUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="u" />
                                        ) : (
                                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{u.userName[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    {/* ТУТ: Відображення преміуму для інших юзерів у списках */}
                                    <span style={{ 
                                        color: u.isPremium ? '#38bdf8' : '#fff', 
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        {u.userName}
                                        {u.isVerified && <span title="Verified" style={{ color: '#38bdf8', fontSize: '12px' }}>✔️</span>}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;