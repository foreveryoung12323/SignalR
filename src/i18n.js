import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "nav.feed": "Feed",
      "nav.messages": "Messages",
      "nav.profile": "Profile",
      "nav.admin": "Admin",
      "nav.logout": "Logout",
      "profile.edit": "Edit Profile",
      "profile.bio_empty": "No bio yet...",
      "profile.joined": "Joined",
      "feed.placeholder": "What's new?",
      "feed.post": "Post",
      "admin.title": "Moderation Panel",
      "chat.placeholder": "Type a message..."
    }
  },
  uk: {
    translation: {
      "nav.feed": "Стрічка",
      "nav.messages": "Чати",
      "nav.profile": "Профіль",
      "nav.admin": "Адмінка",
      "nav.logout": "Вийти",
      "profile.edit": "Редагувати профіль",
      "profile.bio_empty": "Біографія порожня...",
      "profile.joined": "В мережі з",
      "feed.placeholder": "Що у вас нового?",
      "feed.post": "Опублікувати",
      "admin.title": "Панель модерації",
      "chat.placeholder": "Напишіть..."
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "uk", // мова за замовчуванням
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;