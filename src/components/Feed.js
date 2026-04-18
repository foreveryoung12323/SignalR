import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import { LANGUAGE_LABELS, getLocaleForLang, normalizeLang } from '../utils/language';

const UI_TEXT = {
    uk: {
        loading: 'Завантаження стрічки...',
        overline: 'Ваша стрічка',
        title: 'Поділіться моментом',
        subtitle: 'Легка, чиста стрічка з медіа, перекладом і швидкими коментарями.',
        composerNote: 'Новий пост з\'явиться у верхній частині стрічки',
        whatsNew: 'Що нового?',
        allPosts: '🌍 Усі',
        followingPosts: '👥 Підписки',
        publish: 'Опублікувати',
        attach: 'Додати медіа',
        translate: 'Перекласти',
        translated: 'Перекладено',
        comments: 'Коментарі',
        commentPlaceholder: 'Напишіть коментар...',
        createPostError: 'Не вдалося створити пост.',
        translateError: 'Не вдалося перекласти пост.',
        deleteConfirm: 'Видалити цей пост?',
        deleteError: 'Не вдалося видалити пост.',
        deleteCommentConfirm: 'Видалити цей коментар?',
        deleteCommentError: 'Не вдалося видалити коментар.',
        commentError: 'Не вдалося додати коментар.',
        deleteLabel: 'Видалити',
        fallbackAuthor: 'Я',
        selectedMedia: 'Вибраний файл',
        emptyFeed: 'У стрічці поки тихо. Ваш пост може бути першим.',
        noComments: 'Коментарів поки немає.',
        postsLabel: 'постів',
        reactionsLabel: 'реакцій',
        commentsCountLabel: 'коментарів',
        commentLoadError: 'Не вдалося завантажити коментарі:',
        commentCreateErrorLog: 'Не вдалося додати коментар:',
        composerFallback: 'Користувач Signal',
        follow: 'Підписатися',
        unfollow: 'Відписатися',
        premiumBadge: 'Premium'
    },
    en: {
        loading: 'Loading feed...',
        overline: 'Your feed',
        title: 'Share a fresh update',
        subtitle: 'A lighter timeline with media, translation and quick comments.',
        composerNote: 'New posts appear at the top of the timeline',
        whatsNew: "What's new?",
        allPosts: '🌍 All',
        followingPosts: '👥 Following',
        publish: 'Publish',
        attach: 'Add media',
        translate: 'Translate',
        translated: 'Translated',
        comments: 'Comments',
        commentPlaceholder: 'Write a comment...',
        createPostError: 'Could not create the post.',
        translateError: 'Could not translate the post.',
        deleteConfirm: 'Delete this post?',
        deleteError: 'Could not delete the post.',
        deleteCommentConfirm: 'Delete this comment?',
        deleteCommentError: 'Could not delete the comment.',
        commentError: 'Could not add the comment.',
        deleteLabel: 'Delete',
        fallbackAuthor: 'Me',
        selectedMedia: 'Selected file',
        emptyFeed: 'The feed is quiet for now. Your post can break the silence.',
        noComments: 'No comments yet.',
        postsLabel: 'posts',
        reactionsLabel: 'reactions',
        commentsCountLabel: 'comments',
        commentLoadError: 'Could not load comments:',
        commentCreateErrorLog: 'Could not add the comment:',
        composerFallback: 'Signal user',
        follow: 'Follow',
        unfollow: 'Unfollow',
        premiumBadge: 'Premium'
    }
};

const getMediaUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    const apiBaseUrl = API.defaults.baseURL || '';
    const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    return `${serverUrl}${url}`;
};

const formatPostDate = (value, lang) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(getLocaleForLang(lang), { dateStyle: 'medium', timeStyle: 'short' });
};

const getAvatarInitial = (value) => value?.charAt(0)?.toUpperCase() || 'S';

const Feed = ({ language = 'uk', setLanguage }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedType, setFeedType] = useState('all'); 
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [translatedPosts, setTranslatedPosts] = useState({});
    const [showComments, setShowComments] = useState({});
    const [comments, setComments] = useState({});
    const [newCommentText, setNewCommentText] = useState({});
    const [likedPosts, setLikedPosts] = useState({});
    const [myFollowing, setMyFollowing] = useState(new Set());
    
    const currentLanguage = normalizeLang(language);
    const text = UI_TEXT[currentLanguage] || UI_TEXT.uk;

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const url = feedType === 'all' ? '/posts' : '/posts/following';
            const response = await API.get(url);
            const postsData = Array.isArray(response.data) ? response.data : [];
            setPosts(postsData);

            const initialLikes = {};
            postsData.forEach(post => {
                if (post.isLiked) initialLikes[post.id] = true;
            });
            setLikedPosts(initialLikes);

        } catch (error) {
            console.error(error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowing = async () => {
        try {
            const me = await API.get('/users/me');
            setCurrentUser(me.data);
            const res = await API.get(`/follows/following/${me.data.id}`);
            setMyFollowing(new Set(res.data.map(u => u.id)));
        } catch (e) {}
    };

    useEffect(() => {
        fetchPosts();
        fetchFollowing();
    }, [feedType]);

    const playSound = (fileName) => {
        const audio = new Audio(`/sounds/${fileName}`);
        audio.play().catch(() => {});
    };

    const handleFollowToggle = async (targetUserId) => {
        try {
            const isFollowing = myFollowing.has(targetUserId);
            if (isFollowing) {
                await API.post(`/follows/unfollow/${targetUserId}`);
                setMyFollowing(prev => {
                    const next = new Set(prev);
                    next.delete(targetUserId);
                    return next;
                });
            } else {
                await API.post(`/follows/follow/${targetUserId}`);
                setMyFollowing(prev => new Set(prev).add(targetUserId));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreatePost = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('content', newPostContent);
        if (selectedImage) formData.append('file', selectedImage);

        try {
            await API.post('/posts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setNewPostContent('');
            setSelectedImage(null);
            await fetchPosts();
        } catch (error) {
            window.alert(text.createPostError);
        }
    };

    const handleTranslatePost = async (postId, content) => {
        try {
            const response = await API.post('/posts/translate', { text: content, targetLang: currentLanguage });
            setTranslatedPosts((prev) => ({
                ...prev,
                [postId]: { text: response.data.translatedText, lang: currentLanguage }
            }));
        } catch (error) {
            window.alert(text.translateError);
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm(text.deleteConfirm)) return;
        try {
            await API.delete(`/posts/${postId}`);
            setPosts((prev) => prev.filter((post) => post.id !== postId));
        } catch (error) {
            window.alert(text.deleteError);
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
            window.alert(text.deleteCommentError);
        }
    };

    const handleLike = async (postId) => {
        try {
            const response = await API.post(`/likes/${postId}`);
            const isLiked = response.data.liked;
            if (isLiked) playSound('like.mp3');

            setLikedPosts((prev) => ({ ...prev, [postId]: isLiked }));
            setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, likesCount: isLiked ? (post.likesCount || 0) + 1 : Math.max(0, (post.likesCount || 0) - 1) } : post));
        } catch (error) {
            console.error(error);
        }
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
            console.error(text.commentLoadError, error);
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
            if (!newComment.author) newComment.author = currentUser?.userName || text.fallbackAuthor;
            if (!newComment.userId) newComment.userId = currentUser?.id;

            playSound('comment.mp3');
            setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), newComment] }));
            setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
        } catch (error) {
            const message = typeof error?.response?.data === 'string' ? error.response.data : text.commentError;
            window.alert(message);
        }
    };

    const isVideo = (url) => {
        if (!url) return false;
        return ['.mp4', '.webm', '.ogg', '.mov'].some((extension) => url.toLowerCase().endsWith(extension));
    };

    if (loading && posts.length === 0) return <div className="feed-loading-state">{text.loading}</div>;

    return (
        <div className="feed-container">
            
            {currentUser?.warnings > 0 && (
                <div style={{ background: '#451a03', border: '1px solid #d97706', color: '#fbbf24', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span>
                    <div>
                        <strong style={{ fontSize: '16px' }}>Попередження від модератора!</strong>
                        <div style={{ fontSize: '14px', marginTop: '4px' }}>У вас <b>{currentUser.warnings} з 3</b> попереджень.</div>
                    </div>
                </div>
            )}

            <div className="feed-toolbar">
                <div>
                    <div className="feed-overline">{text.overline}</div>
                    <h2 className="feed-title">{text.title}</h2>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button 
                            onClick={() => setFeedType('all')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                backgroundColor: feedType === 'all' ? '#3b82f6' : '#21262d',
                                color: '#fff'
                            }}
                        >
                            {text.allPosts}
                        </button>
                        <button 
                            onClick={() => setFeedType('following')}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                backgroundColor: feedType === 'following' ? '#8a2be2' : '#21262d',
                                color: '#fff'
                            }}
                        >
                            {text.followingPosts}
                        </button>
                    </div>
                </div>
                <div className="feed-toolbar-actions">
                    <span className="feed-stats-chip">{posts.length} {text.postsLabel}</span>
                    <select className="feed-select" value={currentLanguage} onChange={(event) => setLanguage?.(event.target.value)}>
                        {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="feed-post-card feed-hero-card">
                <div className="composer-header">
                    <div className="composer-avatar">{getAvatarInitial(currentUser?.userName)}</div>
                    <div>
                        {/* ТУТ: Відображення преміуму для себе */}
                        <div className="composer-title" style={{ color: currentUser?.isPremium ? '#38bdf8' : 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {currentUser?.userName || text.composerFallback}
                            {currentUser?.isVerified && <span title="Verified" style={{ color: '#38bdf8', fontSize: '14px' }}>✔️</span>}
                        </div>
                        <div className="composer-subtitle">{text.composerNote}</div>
                    </div>
                </div>

                <form onSubmit={handleCreatePost}>
                    <textarea className="feed-textarea" value={newPostContent} onChange={(event) => setNewPostContent(event.target.value)} placeholder={text.whatsNew} required={!selectedImage} />
                    <div className="post-actions">
                        <div className="action-buttons-group">
                            <input id="feed-file-upload" type="file" className="file-input-hidden" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} accept="image/*,video/*" />
                            <label htmlFor="feed-file-upload" className="file-upload-label">{text.attach}</label>
                            {selectedImage && <div className="selected-filename">{text.selectedMedia}: {selectedImage.name}</div>}
                        </div>
                        <button type="submit" className="post-submit-btn">{text.publish}</button>
                    </div>
                </form>
            </div>

            {posts.length === 0 ? (
                <div className="feed-post-card feed-empty-state">{text.emptyFeed}</div>
            ) : (
                posts.map((post) => {
                    const translatedPost = translatedPosts[post.id];
                    const postComments = comments[post.id] || [];
                    const isMyPost = currentUser && post.userId === currentUser.id;
                    const followingThisAuthor = myFollowing.has(post.userId);

                    return (
                        <article key={post.id} className="feed-post-card feed-story-card">
                            <div className="post-header">
                                <div className="post-author-block">
                                    <Link to={`/profile/${post.userId}`} className="post-avatar-link">
                                        <div className="post-avatar">{getAvatarInitial(post.author)}</div>
                                    </Link>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {/* ТУТ: Відображення Преміум кольору та Галочки у автора поста */}
                                            <Link 
                                                to={`/profile/${post.userId}`} 
                                                style={{ 
                                                    textDecoration: 'none', 
                                                    color: post.isPremium ? '#38bdf8' : 'inherit', 
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                {post.author}
                                                {post.isVerified && <span title="Verified" style={{ color: '#38bdf8', fontSize: '14px' }}>✔️</span>}
                                            </Link>
                                            
                                            {!isMyPost && currentUser && (
                                                <button 
                                                    onClick={() => handleFollowToggle(post.userId)}
                                                    style={{ background: 'none', border: 'none', color: followingThisAuthor ? '#8b949e' : '#3b82f6', fontSize: '12px', cursor: 'pointer', padding: '0', fontWeight: 'bold' }}
                                                >
                                                    • {followingThisAuthor ? text.unfollow : text.follow}
                                                </button>
                                            )}
                                        </div>
                                        <div className="post-date">{formatPostDate(post.createdAt, currentLanguage)}</div>
                                    </div>
                                </div>
                                <div className="post-header-actions">
                                    {translatedPost && <span className="post-badge">{text.translated}</span>}
                                    {currentUser && (isMyPost || currentUser.email === 'stepavoloshyn27@gmail.com' || currentUser.role === 'Admin' || currentUser.role === 'Moderator') && (
                                        <button type="button" className="delete-btn" onClick={() => handleDelete(post.id)}>{text.deleteLabel}</button>
                                    )}
                                </div>
                            </div>

                            <div className={`post-content ${translatedPost ? 'post-content-translated' : ''}`}>
                                {translatedPost ? translatedPost.text : post.content}
                            </div>

                            {!translatedPost && post.content && (
                                <button type="button" className="post-translate-btn" onClick={() => handleTranslatePost(post.id, post.content)}>{text.translate}</button>
                            )}

                            {post.imageUrl && (
                                <div className="post-media-frame">
                                    {isVideo(post.imageUrl) ? (
                                        <video src={getMediaUrl(post.imageUrl)} controls className="post-video" />
                                    ) : (
                                        <img src={getMediaUrl(post.imageUrl)} alt="Post media" className="post-img" />
                                    )}
                                </div>
                            )}

                            <div className="post-stats">
                                <span>{post.likesCount || 0} {text.reactionsLabel}</span>
                                <span>{postComments.length} {text.commentsCountLabel}</span>
                            </div>

                            <div className="post-actions-bar">
                                <button type="button" className={`like-btn ${likedPosts[post.id] ? 'active' : ''}`} onClick={() => handleLike(post.id)}>
                                    {likedPosts[post.id] ? '❤️' : '🤍'} {post.likesCount || 0}
                                </button>
                                <button type="button" className={`comment-toggle-btn ${showComments[post.id] ? 'active' : ''}`} onClick={() => toggleComments(post.id)}>
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
                                                    {currentUser && (comment.userId === currentUser.id || currentUser.email === 'stepavoloshyn27@gmail.com' || currentUser.role === 'Admin' || currentUser.role === 'Moderator') && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(post.id, comment.id)} 
                                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}
                                                        >✕</button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <form className="comment-input-form" onSubmit={(event) => handleSendComment(event, post.id)}>
                                        <input className="comment-input" placeholder={text.commentPlaceholder} value={newCommentText[post.id] || ''} onChange={(event) => setNewCommentText((prev) => ({ ...prev, [post.id]: event.target.value }))} />
                                        <button type="submit" className="comment-submit-btn">↗</button>
                                    </form>
                                </div>
                            )}
                        </article>
                    );
                })
            )}
        </div>
    );
};

export default Feed;