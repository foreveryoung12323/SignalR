import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeLang } from '../utils/language';

const WAVEFORM = [0.34, 0.52, 0.78, 0.4, 0.88, 0.58, 0.36, 0.73, 0.48, 0.86, 0.43, 0.68, 0.56, 0.82, 0.31, 0.6];

const UI_TEXT = {
    uk: {
        pause: 'Призупинити',
        play: 'Відтворити',
        progress: 'Прогрес',
        listening: 'Прослуховування',
        voice: 'Голосове повідомлення',
        showTranscript: 'Показати транскрипт',
        hideTranscript: 'Сховати транскрипт',
        generateTranscript: 'Транскрипт',
        transcribingTranscript: 'Готуємо транскрипт...',
        transcriptTitle: 'Транскрипт',
        transcriptErrorTitle: 'Помилка',
        transcriptUnavailable: 'Немає транскрипту.',
        premiumRequired: '💎 Доступно з Premium',
        getPremiumPrompt: 'Транскрипція голосових повідомлень доступна лише для Premium користувачів. Натисніть тут, щоб дізнатися більше.'
    },
    en: {
        pause: 'Pause',
        play: 'Play',
        progress: 'Progress',
        listening: 'Listening',
        voice: 'Voice message',
        showTranscript: 'Show transcript',
        hideTranscript: 'Hide transcript',
        generateTranscript: 'Transcript',
        transcribingTranscript: 'Transcribing...',
        transcriptTitle: 'Transcript',
        transcriptErrorTitle: 'Error',
        transcriptUnavailable: 'No transcript available.',
        premiumRequired: '💎 Premium Required',
        getPremiumPrompt: 'Voice message transcription is only available for Premium users. Click here to learn more.'
    }
};

const formatDuration = (value) => {
    if (!Number.isFinite(value) || value <= 0) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const VoiceMessage = ({
    src,
    isMine,
    language = 'uk',
    transcript = '',
    onRequestTranscript,
    isTranscribing = false,
    transcriptError = '',
    isPremium = false // <--- ДОДАНО ПРОП ДЛЯ ПЕРЕВІРКИ
}) => {
    const audioRef = useRef(null);
    const navigate = useNavigate(); // <--- ДОДАНО ДЛЯ ПЕРЕХОДУ В МАГАЗИН
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
    const [showPremiumPrompt, setShowPremiumPrompt] = useState(false); // <--- ДОДАНО ДЛЯ ПОВІДОМЛЕННЯ

    const currentLanguage = normalizeLang(language);
    const text = UI_TEXT[currentLanguage] || UI_TEXT.uk;
    const transcriptText = transcript.trim();
    const hasTranscript = transcriptText.length > 0;
    const hasTranscriptError = transcriptError.trim().length > 0;
    const shouldShowTranscriptBox = isTranscriptVisible || isTranscribing || hasTranscriptError || showPremiumPrompt;

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                setIsPlaying(false);
            }
        } else {
            audio.pause();
            setIsPlaying(false);
        }
    };

    const handleSeek = (event) => {
        const audio = audioRef.current;
        const nextTime = Number(event.target.value);
        if (!audio || Number.isNaN(nextTime)) return;

        audio.currentTime = nextTime;
        setCurrentTime(nextTime);
    };

    const handleTranscriptAction = async () => {
        // Перевіряємо Premium статус
        if (!isPremium) {
            setShowPremiumPrompt((prev) => !prev);
            return;
        }

        if (hasTranscript) {
            setIsTranscriptVisible((prev) => !prev);
            return;
        }
        setIsTranscriptVisible(true);
        if (!isTranscribing && onRequestTranscript) {
            await onRequestTranscript();
        }
    };

    const handleLoadedMetadata = (e) => {
        const audio = e.target;
        if (audio.duration === Infinity || Number.isNaN(audio.duration) || audio.duration === 0) {
            audio.currentTime = 10000;
            audio.onseeked = () => {
                audio.onseeked = null;
                if (audio.duration !== Infinity) setDuration(audio.duration);
                audio.currentTime = 0;
            };
        } else {
            setDuration(audio.duration);
        }
    };

    const handleTimeUpdate = (e) => {
        const audio = e.target;
        if (audio.currentTime > 9000) return;
        setCurrentTime(audio.currentTime);
        if (audio.duration && audio.duration !== Infinity) {
            setDuration(audio.duration);
        } else {
            setDuration(prev => Math.max(prev, audio.currentTime));
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const safeDuration = duration > 0 ? duration : (currentTime > 0 ? currentTime : 1);
    const progress = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

    let transcriptButtonLabel = text.generateTranscript;
    if (!isPremium) transcriptButtonLabel = text.premiumRequired;
    else if (isTranscribing) transcriptButtonLabel = text.transcribingTranscript;
    else if (hasTranscript) transcriptButtonLabel = isTranscriptVisible ? text.hideTranscript : text.showTranscript;

    let transcriptLabel = text.transcriptTitle;
    if (!isPremium) transcriptLabel = 'Premium';
    else if (hasTranscriptError) transcriptLabel = text.transcriptErrorTitle;

    let transcriptBody = text.transcriptUnavailable;
    if (!isPremium) transcriptBody = text.getPremiumPrompt;
    else if (hasTranscript) transcriptBody = transcriptText;
    else if (hasTranscriptError) transcriptBody = transcriptError;
    else if (isTranscribing) transcriptBody = text.transcribingTranscript;

    let transcriptClassName = 'voice-transcript-box';
    if (!hasTranscript && !hasTranscriptError && isPremium) transcriptClassName += ' empty';
    if (isTranscribing) transcriptClassName += ' loading';
    if (hasTranscriptError) transcriptClassName += ' error';
    if (!isPremium && showPremiumPrompt) transcriptClassName += ' premium-promo';

    return (
        <div className={`voice-message ${isMine ? 'mine' : 'theirs'}`}>
            <div className="voice-message-player">
                <button
                    type="button"
                    className={`voice-play-btn ${isPlaying ? 'playing' : ''}`}
                    onClick={togglePlayback}
                    aria-label={isPlaying ? text.pause : text.play}
                >
                    {isPlaying ? 'II' : '>'}
                </button>

                <div className="voice-message-body">
                    <div className="voice-waveform" aria-hidden="true">
                        {WAVEFORM.map((height, index) => {
                            const filled = progress >= (((index + 1) / WAVEFORM.length) * 100);
                            return (
                                <span
                                    key={`${height}-${index}`}
                                    className={filled ? 'filled' : ''}
                                    style={{ '--voice-bar-height': `${Math.round(height * 24) + 8}px` }}
                                />
                            );
                        })}
                    </div>

                    <input
                        type="range"
                        min="0"
                        max={safeDuration}
                        step="0.05"
                        value={currentTime}
                        className="voice-progress"
                        onChange={handleSeek}
                        aria-label={text.progress}
                    />

                    <div className="voice-message-meta">
                        <span>{isPlaying ? text.listening : text.voice}</span>
                        <span>{`${formatDuration(currentTime)} / ${formatDuration(duration || currentTime)}`}</span>
                    </div>
                </div>
            </div>

            <button
                type="button"
                className={`voice-transcript-btn ${isTranscriptVisible || isTranscribing || showPremiumPrompt ? 'expanded' : ''}`}
                onClick={handleTranscriptAction}
                disabled={isTranscribing}
                style={!isPremium ? { color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold' } : {}}
            >
                {transcriptButtonLabel}
            </button>

            {shouldShowTranscriptBox && (
                <div 
                    className={transcriptClassName} 
                    style={!isPremium ? { background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38bdf8', cursor: 'pointer' } : {}}
                    onClick={() => { if (!isPremium) navigate('/premium'); }}
                >
                    <span className="voice-transcript-label" style={!isPremium ? { color: '#38bdf8' } : {}}>{transcriptLabel}</span>
                    <p className="voice-transcript-text" style={!isPremium ? { color: '#c9d1d9' } : {}}>{transcriptBody}</p>
                </div>
            )}

            <audio 
                ref={audioRef} 
                preload="metadata" 
                src={src} 
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />
        </div>
    );
};

export default VoiceMessage;