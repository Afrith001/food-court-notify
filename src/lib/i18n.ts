import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const en = {
  common: {
    appName: "FoodCourtNotify",
    tagline: "The complete order notification & customer engagement platform for food courts",
    signIn: "Sign in", signUp: "Get started", signOut: "Sign out",
    dashboard: "Dashboard", orders: "Orders", customers: "Customers",
    coupons: "Coupons", campaigns: "Campaigns", analytics: "Analytics",
    subscription: "Subscription", notifications: "Notifications", settings: "Settings",
    save: "Save", cancel: "Cancel", create: "Create", delete: "Delete", edit: "Edit",
    search: "Search", export: "Export CSV", loading: "Loading…",
  },
  auth: {
    email: "Email", password: "Password", shopName: "Shop name", ownerName: "Owner name",
    mobile: "Mobile", category: "Shop category",
    loginTitle: "Welcome back", loginSubtitle: "Sign in to your shop dashboard",
    signupTitle: "Open your shop", signupSubtitle: "Get your QR portal in seconds",
    needAccount: "New here? Create a shop", haveAccount: "Already have an account? Sign in",
    invalidCreds: "Email or password is incorrect.",
    shopMismatch: "This account doesn't belong to that shop.",
  },
  orders: {
    pending: "Pending", preparing: "Preparing", ready: "Ready", completed: "Completed",
    newOrder: "New order", noOrders: "No orders yet",
  },
};

const ta = {
  common: {
    appName: "ஃபுட்கோர்ட் நோட்டிஃபை",
    tagline: "உணவு வளாகங்களுக்கான முழுமையான ஆர்டர் அறிவிப்பு மற்றும் வாடிக்கையாளர் ஈடுபாட்டு தளம்",
    signIn: "உள்நுழைய", signUp: "தொடங்கு", signOut: "வெளியேறு",
    dashboard: "டாஷ்போர்டு", orders: "ஆர்டர்கள்", customers: "வாடிக்கையாளர்கள்",
    coupons: "கூப்பன்கள்", campaigns: "பிரச்சாரங்கள்", analytics: "பகுப்பாய்வு",
    subscription: "சந்தா", notifications: "அறிவிப்புகள்", settings: "அமைப்புகள்",
    save: "சேமி", cancel: "ரத்து", create: "உருவாக்கு", delete: "நீக்கு", edit: "திருத்து",
    search: "தேடல்", export: "CSV ஏற்றுமதி", loading: "ஏற்றுகிறது…",
  },
  auth: {
    email: "மின்னஞ்சல்", password: "கடவுச்சொல்", shopName: "கடை பெயர்",
    ownerName: "உரிமையாளர் பெயர்", mobile: "மொபைல்", category: "கடை வகை",
    loginTitle: "மீண்டும் வரவேற்கிறோம்", loginSubtitle: "உங்கள் கடை டாஷ்போர்டில் உள்நுழையவும்",
    signupTitle: "உங்கள் கடையைத் திறக்கவும்", signupSubtitle: "QR போர்ட்டலை சில நொடிகளில் பெறுங்கள்",
    needAccount: "புதியவரா? கடை உருவாக்கவும்", haveAccount: "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்",
    invalidCreds: "மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது.",
    shopMismatch: "இந்த கணக்கு அந்த கடைக்கு சொந்தமில்லை.",
  },
  orders: {
    pending: "நிலுவையில்", preparing: "தயாரிக்கப்படுகிறது", ready: "தயார்", completed: "முடிந்தது",
    newOrder: "புதிய ஆர்டர்", noOrders: "ஆர்டர்கள் இல்லை",
  },
};

if (typeof window !== "undefined" && !i18n.isInitialized) {
  i18n.use(LanguageDetector).use(initReactI18next).init({
    resources: { en: { translation: en }, ta: { translation: ta } },
    fallbackLng: "en",
    supportedLngs: ["en", "ta"],
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });
}

export default i18n;
