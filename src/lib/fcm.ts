/**
 * Firebase Cloud Messaging — browser push integration.
 *
 * Requires VITE_FIREBASE_VAPID_KEY in addition to the standard Firebase
 * configuration in src/lib/firebase.ts. Without VAPID, the app continues
 * to work — notifications are still written to Firestore and visible in
 * the in-app notification center.
 */
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseApp, getDb, COL, firebaseConfigured } from "@/lib/firebase";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export const fcmConfigured = Boolean(firebaseConfigured && vapidKey);

let _messaging: Messaging | null = null;

function getFcm(): Messaging | null {
  if (!fcmConfigured || typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (!_messaging) _messaging = getMessaging(getFirebaseApp());
  return _messaging;
}

export async function requestNotificationPermissionAndSaveToken(
  userId: string,
): Promise<string | null> {
  const m = getFcm();
  if (!m) return null;
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return null;
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(m, { vapidKey, serviceWorkerRegistration: reg });
    if (token) {
      await setDoc(doc(getDb(), COL.users, userId), { fcmToken: token }, { merge: true });
    }
    return token;
  } catch (e) {
    console.warn("[fcm] permission/token failed", e);
    return null;
  }
}

export function listenForegroundMessages(cb: (title: string, body: string) => void) {
  const m = getFcm();
  if (!m) return () => {};
  return onMessage(m, (payload) => {
    const title = payload.notification?.title ?? "Notification";
    const body = payload.notification?.body ?? "";
    cb(title, body);
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
  });
}
