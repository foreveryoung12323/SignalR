export const SUPPORTED_LANGS = ['uk', 'en'];

export const LANGUAGE_LABELS = {
    uk: 'Українська',
    en: 'English'
};

export const normalizeLang = (lang) => {
    if (!lang) {
        return 'uk';
    }

    const shortLang = lang.toLowerCase().slice(0, 2);
    return SUPPORTED_LANGS.includes(shortLang) ? shortLang : 'uk';
};

export const getSavedLanguage = () => {
    const savedLang =
        typeof window !== 'undefined' ? window.localStorage.getItem('app-lang') : null;
    const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'uk';

    return normalizeLang(savedLang || browserLang);
};

export const getLocaleForLang = (lang) =>
    normalizeLang(lang) === 'en' ? 'en-US' : 'uk-UA';
