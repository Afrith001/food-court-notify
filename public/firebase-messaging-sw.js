// Firebase Cloud Messaging service worker.
// Populated at runtime from /firebase-sw-config.js (optional) or you may
// hardcode your Firebase config below to enable background push delivery.
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "",
  authDomain: "food-court-notify.firebaseapp.com",
  projectId: "food-court-notify",
  storageBucket: "food-court-notify.firebasestorage.app",
  messagingSenderId: "590207079316",
  appId: "1:590207079316:web:ee9aa51a2e3983e498b581",
});

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Notification";
    const options = {
      body: payload.notification?.body || "",
      icon: "/icon-192.png",
    };
    self.registration.showNotification(title, options);
  });
} catch (e) {
  // Messaging unsupported in this browser/environment.
}
