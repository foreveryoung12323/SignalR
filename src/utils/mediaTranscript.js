import API from '../utils/api';

export const transcribeMediaFromUrl = async (mediaUrl, language = 'uk') => {
    if (!mediaUrl) {
        return '';
    }

    try {
        // Теперь фронтенд не мучает браузер нейросетями, 
        // а просто просит твой C#-сервер сделать всю тяжелую работу
        const response = await API.post('/audio/transcribe', {
            mediaUrl: mediaUrl,
            language: language
        });
        
        return response.data?.transcript || '';
    } catch (error) {
        console.error('Ошибка транскрибации на сервере:', error);
        return '';
    }
};