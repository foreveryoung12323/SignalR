import React, { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import API from '../utils/api';
import VoiceMessage from './VoiceMessage';
import { getLocaleForLang, normalizeLang } from '../utils/language';
import { transcribeMediaFromUrl } from '../utils/mediaTranscript';

const EMOJIS = ['😀', '😂', '🥰', '😎', '😭', '😡', '👍', '👎', '🔥', '❤️', '🎉', '🤔', '👀', '🤯', '👽'];

const STICKERS = [
    'https://cdn-icons-png.flaticon.com/512/4613/4613204.png',
    'https://cdn-icons-png.flaticon.com/512/4613/4613206.png',
    'https://cdn-icons-png.flaticon.com/512/4613/4613220.png',
    'https://cdn-icons-png.flaticon.com/512/4613/4613214.png',
    'https://cdn-icons-png.flaticon.com/512/4613/4613211.png',
    'https://cdn-icons-png.flaticon.com/512/4613/4613227.png'
];

const UI_TEXT = {
    uk: {
        previewSticker: 'Стікер',
        previewPhoto: 'Фото',
        previewVideo: 'Відео',
        previewVoice: 'Голосове повідомлення',
        previewNewMessage: 'Нове повідомлення',
        loadChatsError: 'Не вдалося завантажити чати:',
        reconnectError: 'Не вдалося повторно підключити чат:',
        signalRError: 'Помилка SignalR:',
        openChatError: 'Не вдалося відкрити чат:',
        sendMessageError: 'Не вдалося надіслати повідомлення:',
        translateError: 'Не вдалося перекласти повідомлення.',
        sendStickerError: 'Не вдалося надіслати стікер:',
        uploadFileError: 'Не вдалося завантажити файл.',
        recordingUnsupported: 'Запис голосу не підтримується у цьому браузері.',
        sendVoiceErrorLog: 'Не вдалося надіслати голосове повідомлення:',
        sendVoiceError: 'Не вдалося надіслати голосове повідомлення.',
        audioRecordError: 'Помилка запису аудіо:',
        microphoneError: 'Немає доступу до мікрофона.',
        deleteChatConfirm: 'Видалити діалог?',
        deleteChatError: 'Не вдалося видалити чат.',
        avatarAlt: 'Аватар',
        stickerAlt: 'Стікер',
        attachmentAlt: 'Вкладення',
        translateLabel: 'Перекласти',
        direct: 'Діалоги',
        sidebarTitle: 'Повідомлення',
        startDialog: 'Почніть діалог',
        chooseChat: 'Оберіть чат',
        chooseChatHint: 'Текст, вкладення та голосові повідомлення вже готові до відправлення.',
        recordingStatus: 'Триває запис голосового повідомлення',
        voiceAvailable: 'У діалозі доступні голосові повідомлення',
        uploadingVoice: 'Надсилаємо голосове...',
        emojiTab: 'Emoji',
        stickersTab: 'Stickers',
        recordingLabel: 'Запис',
        cancel: 'Скасувати',
        sendVoice: 'Надіслати голосове',
        file: 'Файл',
        voice: 'Голос',
        messagePlaceholder: 'Повідомлення...',
        send: 'Надіслати',
        transcriptRecognition: 'Розпізнаємо мовлення...',
        transcriptServerHint: 'У цьому браузері немає вбудованого розпізнавання, але після відправлення можна отримати транскрипт із сервера.',
        transcriptRequestError: 'Не вдалося отримати транскрипт.',
        transcriptEmptyError: 'Не вдалося розпізнати мовлення у цьому голосовому.',
        online: '🟢 В мережі',
        lastSeenMins: 'Був(ла) $ хв тому',
        lastSeenHours: 'Був(ла) $ год тому',
        banned: '🚫 Заблоковано'
    },
    en: {
        previewSticker: 'Sticker',
        previewPhoto: 'Photo',
        previewVideo: 'Video',
        previewVoice: 'Voice message',
        previewNewMessage: 'New message',
        loadChatsError: 'Could not load chats:',
        reconnectError: 'Could not reconnect to the chat:',
        signalRError: 'SignalR error:',
        openChatError: 'Could not open the chat:',
        sendMessageError: 'Could not send the message:',
        translateError: 'Could not translate the message.',
        sendStickerError: 'Could not send the sticker:',
        uploadFileError: 'Could not upload the file.',
        recordingUnsupported: 'Voice recording is not supported in this browser.',
        sendVoiceErrorLog: 'Could not send the voice message:',
        sendVoiceError: 'Could not send the voice message.',
        audioRecordError: 'Audio recording error:',
        microphoneError: 'No microphone access.',
        deleteChatConfirm: 'Delete this conversation?',
        deleteChatError: 'Could not delete the chat.',
        avatarAlt: 'Avatar',
        stickerAlt: 'Sticker',
        attachmentAlt: 'Attachment',
        translateLabel: 'Translate',
        direct: 'Direct',
        sidebarTitle: 'Messages',
        startDialog: 'Start a chat',
        chooseChat: 'Choose a chat',
        chooseChatHint: 'Text, attachments, and voice messages are ready to send.',
        recordingStatus: 'Recording a voice message',
        voiceAvailable: 'Voice messages are available in this chat',
        uploadingVoice: 'Uploading voice...',
        emojiTab: 'Emoji',
        stickersTab: 'Stickers',
        recordingLabel: 'Recording',
        cancel: 'Cancel',
        sendVoice: 'Send voice',
        file: 'File',
        voice: 'Voice',
        messagePlaceholder: 'Message...',
        send: 'Send',
        transcriptRecognition: 'Listening for transcript...',
        transcriptServerHint: 'Live speech recognition is not available in this browser, but you can request the transcript from the server after sending the voice message.',
        transcriptRequestError: 'Could not get the transcript.',
        transcriptEmptyError: 'Could not detect speech in this voice message.',
        online: '🟢 Online',
        lastSeenMins: 'Last seen $ mins ago',
        lastSeenHours: 'Last seen $ hours ago',
        banned: '🚫 Banned'
    }
};

const playSound = (fileName) => {
    const audio = new Audio(`/sounds/${fileName}`);
    audio.play().catch(() => {});
};

const getMediaUrl = (url) => {
    if (!url) {
        return '';
    }

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    const apiBaseUrl = API.defaults.baseURL || '';
    const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    return `${serverUrl}${url}`;
};

const getHubUrl = () => {
    const apiBaseUrl = API.defaults.baseURL || '';
    const serverUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    return `${serverUrl}/chatHub`;
};

const getMessageType = (text = '') => {
    if (text.startsWith('[sticker]')) return 'sticker';
    if (text.startsWith('[image]')) return 'image';
    if (text.startsWith('[video]')) return 'video';
    if (text.startsWith('[audio]')) return 'audio';
    return 'text';
};

const getMessagePreview = (value = '', text) => {
    const type = getMessageType(value);

    if (type === 'sticker') return text.previewSticker;
    if (type === 'image') return text.previewPhoto;
    if (type === 'video') return text.previewVideo;
    if (type === 'audio') return text.previewVoice;

    return value.length > 48 ? `${value.slice(0, 45)}...` : value || text.previewNewMessage;
};

const formatMessageTime = (value, lang) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString(getLocaleForLang(lang), {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatLastSeen = (dateString, textObj) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const diffMins = Math.floor((new Date() - date) / 60000);
    
    if (diffMins < 3) return <span style={{ color: '#10b981' }}>{textObj.online}</span>;
    if (diffMins < 60) return textObj.lastSeenMins.replace('$', diffMins);
    if (diffMins < 24 * 60) return textObj.lastSeenHours.replace('$', Math.floor(diffMins / 60));
    return date.toLocaleDateString();
};

const formatRecordingTime = (seconds) => {
    const safeValue = Number.isFinite(seconds) ? seconds : 0;
    const minutes = Math.floor(safeValue / 60);
    const remainder = safeValue % 60;

    return `${minutes}:${String(remainder).padStart(2, '0')}`;
};

const TRANSCRIPT_TAG_PATTERN = /\[transcript\]([\s\S]*?)\[\/transcript\]/i;

const getSpeechRecognitionCtor = () =>
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

const getVoiceMimeType = () => {
    if (typeof MediaRecorder === 'undefined') {
        return '';
    }

    const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4'
    ];

    return preferredMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
};

const getVoiceExtension = (mimeType = '') => {
    if (mimeType.includes('ogg')) {
        return 'ogg';
    }

    if (mimeType.includes('mp4')) {
        return 'm4a';
    }

    return 'webm';
};

const decodeTranscript = (value = '') => {
    if (!value) {
        return '';
    }

    try {
        return decodeURIComponent(value);
    } catch (error) {
        return value;
    }
};

const buildAudioMessage = (url, transcript = '') => {
    const trimmedTranscript = transcript.trim();

    if (!trimmedTranscript) {
        return `[audio]${url}[/audio]`;
    }

    return `[audio]${url}[/audio][transcript]${encodeURIComponent(trimmedTranscript)}[/transcript]`;
};

const parseMessagePayload = (messageText = '') => {
    const type = getMessageType(messageText);
    const transcriptMatch = messageText.match(TRANSCRIPT_TAG_PATTERN);
    const transcript = transcriptMatch ? decodeTranscript(transcriptMatch[1]) : '';
    const cleanText = messageText.replace(TRANSCRIPT_TAG_PATTERN, '');
    const value = cleanText.replace(/\[\/?(sticker|image|video|audio)\]/g, '');

    return {
        type,
        value,
        transcript
    };
};

const getMessageKey = (message = {}) =>
    String(message.id || `${message.createdAt || 'message'}-${message.userId || 'user'}`);

const Messages = ({ language = 'uk' }) => {
    const [users, setUsers] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [activePeer, setActivePeer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showPanel, setShowPanel] = useState(false);
    const [panelTab, setPanelTab] = useState('emojis');
    const [hubConnection, setHubConnection] = useState(null);
    const [myId, setMyId] = useState(null);
    const [isPremium, setIsPremium] = useState(false); // <--- ДОДАНО СТАН ДЛЯ PREMIUM
    const [unreadCounts, setUnreadCounts] = useState({});
    const [lastMessages, setLastMessages] = useState({});
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploadingVoice, setIsUploadingVoice] = useState(false);
    const [recordingError, setRecordingError] = useState('');
    const [recordingTranscript, setRecordingTranscript] = useState('');
    const [transcribingMessages, setTranscribingMessages] = useState({});
    const [transcriptionErrors, setTranscriptionErrors] = useState({});
    const currentLanguage = normalizeLang(language);
    const text = UI_TEXT[currentLanguage] || UI_TEXT.uk;

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeChatRef = useRef(null);
    const activePeerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordingStreamRef = useRef(null);
    const recordingIntervalRef = useRef(null);
    const cancelRecordingRef = useRef(false);
    const speechRecognitionRef = useRef(null);
    const transcriptRef = useRef('');
    const recordingTranscriptRef = useRef('');

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    useEffect(() => {
        activePeerRef.current = activePeer;
    }, [activePeer]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [meResponse, usersResponse] = await Promise.all([
                    API.get('/users/me'),
                    API.get('/chats/users')
                ]);

                setMyId(meResponse.data.id);
                setIsPremium(meResponse.data.isPremium); // <--- ЗБЕРІГАЄМО СТАТУС ПРЕМІУМУ З БЕКЕНДУ
                setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
            } catch (error) {
                console.error(text.loadChatsError, error);
            }
        };

        loadData();
    }, [text.loadChatsError]);

    useEffect(() => {
        if (!myId) {
            return undefined;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(getHubUrl(), {
                accessTokenFactory: () => sessionStorage.getItem('token')
            })
            .withAutomaticReconnect()
            .build();

        const handleReceiveMessage = (incomingChatId, senderId, msgText, createdAt, messageId) => {
            const isActiveThread = activeChatRef.current === incomingChatId;
            const peerId = senderId === myId ? activePeerRef.current?.id : senderId;

            if (isActiveThread) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: messageId || `${incomingChatId}-${senderId}-${createdAt}`,
                        chatId: incomingChatId,
                        userId: senderId,
                        text: msgText,
                        createdAt
                    }
                ]);
            } else if (senderId !== myId) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }));
            }

            if (peerId) {
                setLastMessages((prev) => ({
                    ...prev,
                    [peerId]: getMessagePreview(msgText, UI_TEXT[currentLanguage] || UI_TEXT.uk)
                }));
            }

            if (senderId !== myId) {
                playSound('message.mp3');
            }
        };

        connection.on('ReceiveMessage', handleReceiveMessage);

        connection.onreconnected(async () => {
            if (activeChatRef.current) {
                try {
                    await connection.invoke('JoinChat', activeChatRef.current);
                } catch (error) {
                    console.error(text.reconnectError, error);
                }
            }
        });

        connection.start().catch((error) => console.error(text.signalRError, error));
        setHubConnection(connection);

        return () => {
            connection.off('ReceiveMessage', handleReceiveMessage);
            connection.stop().catch(() => {});
        };
    }, [myId, currentLanguage, text.reconnectError, text.signalRError]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => () => {
        if (recordingIntervalRef.current) {
            window.clearInterval(recordingIntervalRef.current);
        }

        if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        }
    }, []);

    const stopTranscriptRecognition = () => {
        const recognition = speechRecognitionRef.current;

        if (!recognition) {
            return;
        }

        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;

        try {
            recognition.stop();
        } catch (error) {
        }

        speechRecognitionRef.current = null;
    };

    const resetRecordingState = () => {
        setIsRecording(false);
        setRecordingTime(0);
        setRecordingTranscript('');
        transcriptRef.current = '';
        recordingTranscriptRef.current = '';

        if (recordingIntervalRef.current) {
            window.clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }

        if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach((track) => track.stop());
            recordingStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        stopTranscriptRecognition();
    };

    const uploadChatMedia = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await API.post('/posts/upload-chat-media', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    };

    const sendHubMessage = async (msgText) => {
        if (
            !msgText ||
            !hubConnection ||
            hubConnection.state !== signalR.HubConnectionState.Connected ||
            !activeChat
        ) {
            return;
        }

        await hubConnection.invoke('SendMessage', myId, activeChat, msgText);

        if (activePeerRef.current?.id) {
            setLastMessages((prev) => ({
                ...prev,
                [activePeerRef.current.id]: getMessagePreview(
                    msgText,
                    UI_TEXT[currentLanguage] || UI_TEXT.uk
                )
            }));
        }
    };

    const startChat = async (user) => {
        try {
            const chatResponse = await API.post(`/chats/start/${user.id}`);
            const chatId = chatResponse.data.id;
            const historyResponse = await API.get(`/chats/${chatId}/messages`);
            const history = Array.isArray(historyResponse.data) ? historyResponse.data : [];

            setActivePeer(user);
            setActiveChat(chatId);
            setMessages(history);
            setUnreadCounts((prev) => ({ ...prev, [user.id]: 0 }));
            setRecordingError('');
            setTranscribingMessages({});
            setTranscriptionErrors({});

            if (history.length > 0) {
                setLastMessages((prev) => ({
                    ...prev,
                    [user.id]: getMessagePreview(
                        history[history.length - 1].text,
                        UI_TEXT[currentLanguage] || UI_TEXT.uk
                    )
                }));
            }

            if (hubConnection && hubConnection.state === signalR.HubConnectionState.Connected) {
                await hubConnection.invoke('JoinChat', chatId);
            }

            setShowPanel(false);
        } catch (error) {
            console.error(text.openChatError, error);
        }
    };

    const sendMessage = async (event) => {
        event.preventDefault();

        const trimmedMessage = newMessage.trim();

        if (!trimmedMessage) {
            return;
        }

        try {
            await sendHubMessage(trimmedMessage);
            setNewMessage('');
            setShowPanel(false);
        } catch (error) {
            console.error(text.sendMessageError, error);
        }
    };

    const handleTranslate = async (index, content) => {
        try {
            const response = await API.post('/posts/translate', {
                text: content,
                targetLang: currentLanguage
            });

            setMessages((prev) =>
                prev.map((message, messageIndex) =>
                    messageIndex === index
                        ? { ...message, translatedText: response.data.translatedText }
                        : message
                )
            );
        } catch (error) {
            console.error(text.translateError, error);
        }
    };

    const sendSticker = async (stickerUrl) => {
        try {
            await sendHubMessage(`[sticker]${stickerUrl}[/sticker]`);
            setShowPanel(false);
        } catch (error) {
            console.error(text.sendStickerError, error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        try {
            const { url, type } = await uploadChatMedia(file);
            await sendHubMessage(`[${type}]${url}[/${type}]`);
        } catch (error) {
            window.alert(text.uploadFileError);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const startVoiceRecording = async () => {
        if (!activeChat || !hubConnection) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setRecordingError(text.recordingUnsupported);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getVoiceMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            recordingStreamRef.current = stream;
            mediaRecorderRef.current = recorder;
            recordedChunksRef.current = [];
            cancelRecordingRef.current = false;
            transcriptRef.current = '';
            recordingTranscriptRef.current = '';
            setRecordingError('');
            setShowPanel(false);
            setIsRecording(true);
            setRecordingTime(0);
            setRecordingTranscript('');

            recordingIntervalRef.current = window.setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

            const SpeechRecognitionCtor = getSpeechRecognitionCtor();

            if (SpeechRecognitionCtor) {
                try {
                    const recognition = new SpeechRecognitionCtor();
                    recognition.lang = getLocaleForLang(currentLanguage);
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.maxAlternatives = 1;

                    recognition.onresult = (event) => {
                        let interimTranscript = '';

                        for (let index = event.resultIndex; index < event.results.length; index += 1) {
                            const chunk = event.results[index][0]?.transcript?.trim();

                            if (!chunk) {
                                continue;
                            }

                            if (event.results[index].isFinal) {
                                transcriptRef.current = `${transcriptRef.current} ${chunk}`.trim();
                            } else {
                                interimTranscript = `${interimTranscript} ${chunk}`.trim();
                            }
                        }

                        recordingTranscriptRef.current = [transcriptRef.current, interimTranscript]
                            .filter(Boolean)
                            .join(' ')
                            .trim();
                        setRecordingTranscript(recordingTranscriptRef.current);
                    };

                    recognition.onerror = () => {};
                    recognition.start();
                    speechRecognitionRef.current = recognition;
                } catch (error) {
                    speechRecognitionRef.current = null;
                }
            }

            recorder.ondataavailable = (mediaEvent) => {
                if (mediaEvent.data?.size) {
                    recordedChunksRef.current.push(mediaEvent.data);
                }
            };

            recorder.onstop = async () => {
                const chunks = [...recordedChunksRef.current];
                const currentMimeType = recorder.mimeType || mimeType || 'audio/webm';
                const shouldSend = !cancelRecordingRef.current && chunks.length > 0;
                const transcript = recordingTranscriptRef.current.trim() || transcriptRef.current.trim();

                resetRecordingState();

                if (!shouldSend) {
                    return;
                }

                try {
                    setIsUploadingVoice(true);

                    const extension = getVoiceExtension(currentMimeType);
                    const voiceFile = new File(
                        [new Blob(chunks, { type: currentMimeType })],
                        `voice-${Date.now()}.${extension}`,
                        { type: currentMimeType }
                    );

                    const { url } = await uploadChatMedia(voiceFile);
                    await sendHubMessage(buildAudioMessage(url, transcript));
                } catch (error) {
                    console.error(text.sendVoiceErrorLog, error);
                    setRecordingError(text.sendVoiceError);
                } finally {
                    setIsUploadingVoice(false);
                }
            };

            recorder.start();
        } catch (error) {
            console.error(text.audioRecordError, error);
            setRecordingError(text.microphoneError);
            resetRecordingState();
        }
    };

    const stopVoiceRecording = (shouldSend) => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            resetRecordingState();
            return;
        }

        cancelRecordingRef.current = !shouldSend;
        mediaRecorderRef.current.stop();
    };

    const handleTranscribeMessage = async (message) => {
        const messageKey = getMessageKey(message);
        const { type, value } = parseMessagePayload(message?.text || '');

        if (!message?.id || type !== 'audio' || !value) {
            setTranscriptionErrors((prev) => ({
                ...prev,
                [messageKey]: text.transcriptRequestError
            }));
            return;
        }

        setTranscribingMessages((prev) => ({
            ...prev,
            [messageKey]: true
        }));
        setTranscriptionErrors((prev) => ({
            ...prev,
            [messageKey]: ''
        }));

        try {
            const mediaUrl = getMediaUrl(value);
            const transcriptText = await transcribeMediaFromUrl(mediaUrl, currentLanguage);

            if (!transcriptText) {
                throw new Error(text.transcriptEmptyError);
            }

            const response = await API.post(`/chats/messages/${message.id}/transcript`, {
                language: currentLanguage,
                transcript: transcriptText
            });

            const nextText = response.data?.text;
            if (!nextText) {
                throw new Error(text.transcriptRequestError);
            }

            setMessages((prev) =>
                prev.map((item) =>
                    item.id === message.id
                        ? {
                            ...item,
                            text: nextText
                        }
                        : item
                )
            );
        } catch (error) {
            const serverMessage =
                typeof error.response?.data === 'string'
                    ? error.response.data
                    : error.response?.data?.message;

            setTranscriptionErrors((prev) => ({
                ...prev,
                [messageKey]: serverMessage || error.message || text.transcriptRequestError
            }));
            console.error('Could not request transcript:', error);
        } finally {
            setTranscribingMessages((prev) => {
                const nextState = { ...prev };
                delete nextState[messageKey];
                return nextState;
            });
        }
    };

    const deleteChat = async (event, targetUserId) => {
        event.stopPropagation();

        if (!window.confirm(text.deleteChatConfirm)) {
            return;
        }

        try {
            const response = await API.post(`/chats/start/${targetUserId}`);
            await API.delete(`/chats/${response.data.id}`);

            if (activeChat === response.data.id) {
                setActiveChat(null);
                setActivePeer(null);
                setMessages([]);
            }
        } catch (error) {
            window.alert(text.deleteChatError);
        }
    };

    const renderAvatar = (user, className) => {
        if (user?.avatarUrl) {
            return (
                <img
                    src={getMediaUrl(user.avatarUrl)}
                    alt={user.userName || text.avatarAlt}
                    className={className}
                />
            );
        }

        return (
            <div className="post-avatar chat-avatar-fill">
                {user?.userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
        );
    };

    const renderMessageContent = (message, index, isMine) => {
        const { type, value, transcript } = parseMessagePayload(message.text);

        if (type === 'sticker') return <img src={value} alt={text.stickerAlt} className="chat-sticker" />;
        if (type === 'image') return <img src={getMediaUrl(value)} alt={text.attachmentAlt} className="chat-attachment" />;
        if (type === 'video') return <video src={getMediaUrl(value)} controls className="chat-video-player" />;
        if (type === 'audio') {
            const messageKey = String(message.id || `${message.createdAt}-${message.userId}`);
            return (
                <VoiceMessage
                    src={getMediaUrl(value)}
                    isMine={isMine}
                    language={currentLanguage}
                    transcript={transcript}
                    onRequestTranscript={() => handleTranscribeMessage(message)}
                    isTranscribing={Boolean(transcribingMessages[messageKey])}
                    transcriptError={transcriptionErrors[messageKey] || ''}
                    isPremium={isPremium} // <--- ПЕРЕДАЄМО СТАТУС В КОМПОНЕНТ ГОЛОСОВОГО
                />
            );
        }

        return (
            <div className="text-msg-container">
                <div className="msg-text-original">{message.text}</div>
                
                {message.translatedText && (
                    <div className="msg-translation-wrapper">
                        <span className="msg-translate-icon">🌐</span>
                        <div className="msg-text-translated">{message.translatedText}</div>
                    </div>
                )}

                {!message.translatedText && (
                    <div className="msg-action-area">
                        <button
                            type="button"
                            className="msg-action-link"
                            onClick={() => handleTranslate(index, message.text)}
                        >
                            {text.translateLabel}
                        </button>
                    </div>
                )}
            </div>
        );
    };
    return (
        <div className="chat-container">
            <aside className="chat-sidebar">
                <div className="chat-sidebar-top">
                    <div>
                        <p className="chat-eyebrow">{text.direct}</p>
                        <h2 className="chat-sidebar-title">{text.sidebarTitle}</h2>
                    </div>
                    <span className="chat-counter">{users.length}</span>
                </div>

                <div className="chat-contact-list">
                    {users.map((user) => (
                        <div
                            key={user.id}
                            className={`chat-contact ${activePeer?.id === user.id ? 'active' : ''}`}
                            onClick={() => { if (!user.isBanned) startChat(user); }}
                        >
                            <div className="contact-avatar-wrap avatar-shell" style={{ filter: user.isBanned ? 'grayscale(1)' : 'none' }}>
                                {renderAvatar(user, 'contact-avatar-image')}
                            </div>

                            <div className="contact-info">
                                <div className="contact-title-row">
                                    <span className="chat-contact-name" style={{ color: user.isBanned ? '#ef4444' : 'inherit' }}>
                                        {user.userName} {user.isBanned && '🚫'}
                                    </span>
                                    {unreadCounts[user.id] > 0 && (
                                        <span className="unread-badge">{unreadCounts[user.id]}</span>
                                    )}
                                </div>

                                <div className="contact-preview">
                                    {user.isBanned ? <span style={{ color: '#ef4444' }}>{text.banned}</span> : lastMessages[user.id] || text.startDialog}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="chat-danger-btn"
                                onClick={(event) => deleteChat(event, user.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            <section className="chat-area">
                {!activeChat || !activePeer ? (
                    <div className="chat-placeholder">
                        <div className="chat-placeholder-card">
                            <div className="chat-placeholder-icon">♪</div>
                            <h3>{text.chooseChat}</h3>
                            <p>{text.chooseChatHint}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <header className="chat-thread-header">
                            <div className="chat-thread-user">
                                <div className="thread-avatar-wrap avatar-shell">
                                    {renderAvatar(activePeer, 'post-avatar-image')}
                                </div>
                                <div>
                                    <div className="chat-thread-name">{activePeer.userName}</div>
                                    <div className="chat-thread-status">
                                        {isRecording
                                            ? <span style={{ color: '#ef4444' }}>{text.recordingStatus}</span>
                                            : formatLastSeen(activePeer.lastSeen, text)}
                                    </div>
                                </div>
                            </div>

                            <div className="chat-thread-meta">
                                {isUploadingVoice && (
                                    <span className="chat-status-pill">{text.uploadingVoice}</span>
                                )}
                            </div>
                        </header>

                        <div className="chat-messages" onClick={() => setShowPanel(false)}>
                            {messages.map((message, index) => {
                                const isMine = message.userId === myId;
                                const type = getMessageType(message.text);
                                const bubbleClassName = [
                                    'message-bubble',
                                    isMine ? 'message-mine' : 'message-theirs',
                                    type === 'sticker' ? 'bubble-transparent' : '',
                                    type === 'image' || type === 'video' ? 'media-bubble' : ''
                                ]
                                    .filter(Boolean)
                                    .join(' ');

                                return (
                                    <div
                                        key={message.id || `${message.createdAt}-${index}`}
                                        className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}
                                    >
                                        <div className={bubbleClassName}>
                                            {renderMessageContent(message, index, isMine)}
                                            <div className="message-time">
                                                {formatMessageTime(message.createdAt, currentLanguage)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input-wrapper">
                            {recordingError && <div className="chat-inline-alert">{recordingError}</div>}

                            {showPanel && (
                                <div className="media-panel">
                                    <div className="media-tabs">
                                        <button
                                            type="button"
                                            className={panelTab === 'emojis' ? 'active' : ''}
                                            onClick={() => setPanelTab('emojis')}
                                        >
                                            {text.emojiTab}
                                        </button>
                                        <button
                                            type="button"
                                            className={panelTab === 'stickers' ? 'active' : ''}
                                            onClick={() => setPanelTab('stickers')}
                                        >
                                            {text.stickersTab}
                                        </button>
                                    </div>

                                    <div className="media-content">
                                        {panelTab === 'emojis' ? (
                                            <div className="emoji-grid">
                                                {EMOJIS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        className="emoji-btn"
                                                        onClick={() => setNewMessage((prev) => prev + emoji)}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="sticker-grid">
                                                {STICKERS.map((stickerUrl) => (
                                                    <button
                                                        key={stickerUrl}
                                                        type="button"
                                                        className="sticker-btn"
                                                        onClick={() => sendSticker(stickerUrl)}
                                                    >
                                                        <img src={stickerUrl} alt={text.stickerAlt} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isRecording ? (
                                <div className="chat-recording-bar">
                                    <div className="chat-recording-indicator">
                                        <span className="chat-recording-dot" />
                                        <div className="chat-recording-copy">
                                            <span>
                                                {text.recordingLabel} {formatRecordingTime(recordingTime)}
                                            </span>
                                            {recordingTranscript && (
                                                <span className="chat-recording-transcript">
                                                    {currentLanguage === 'en' ? 'Transcript:' : 'Транскрипт:'} {recordingTranscript}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="chat-recording-actions">
                                        <button
                                            type="button"
                                            className="chat-secondary-btn"
                                            onClick={() => stopVoiceRecording(false)}
                                        >
                                            {text.cancel}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary chat-send-btn"
                                            onClick={() => stopVoiceRecording(true)}
                                        >
                                            {text.sendVoice}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={sendMessage} className="chat-input-area">
                                    <input
                                        id="chat-file"
                                        type="file"
                                        ref={fileInputRef}
                                        className="file-input-hidden"
                                        accept="image/*,video/*,audio/*"
                                        onChange={handleFileUpload}
                                    />

                                    <label htmlFor="chat-file" className="chat-tool-btn">
                                        {text.file}
                                    </label>

                                    <button
                                        type="button"
                                        className={`chat-tool-btn ${showPanel ? 'active' : ''}`}
                                        onClick={() => setShowPanel((prev) => !prev)}
                                    >
                                        Emoji
                                    </button>

                                    <button
                                        type="button"
                                        className="chat-tool-btn voice-trigger"
                                        onClick={startVoiceRecording}
                                        disabled={isUploadingVoice}
                                    >
                                        {text.voice}
                                    </button>

                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder={text.messagePlaceholder}
                                        value={newMessage}
                                        onChange={(event) => setNewMessage(event.target.value)}
                                    />

                                    <button type="submit" className="btn-primary chat-send-btn">
                                        {text.send}
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default Messages;