import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, signInAnonymously } from "firebase/auth";

/**
 * Centralized Firebase Web SDK configuration
 * Connected to Firebase project: solar-80062
 */
const firebaseConfig = {
  apiKey: "AIzaSyAqt7DgRPy-cJuaT9qVIvtlht1Ki1JCPro",
  authDomain: "solar-80062.firebaseapp.com",
  databaseURL: (typeof window !== "undefined" && window.FIREBASE_DATABASE_URL) || "https://solar-80062-default-rtdb.firebaseio.com",
  projectId: "solar-80062",
  storageBucket: "solar-80062.firebasestorage.app",
  messagingSenderId: "353852532789",
  appId: "1:353852532789:web:f60157921ff9ee55c9297c",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const database = getDatabase(app);

// Authentication support: Auto-sign in anonymously if rules require 'auth != null'
export const auth = getAuth(app);
if (typeof window !== "undefined") {
  signInAnonymously(auth)
    .then((userCredential) => {
      console.log("[Firebase Auth] Signed in anonymously (auth != null satisfied). UID:", userCredential.user.uid);
    })
    .catch((err) => {
      console.info("[Firebase Auth] Anonymous sign-in note:", err.message);
    });
}

// Analytics is optional and must not prevent the dashboard from loading if unavailable
let analyticsInstance = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          analyticsInstance = getAnalytics(app);
        } catch {
          // Analytics initialization failed or disabled; fail silently
        }
      }
    })
    .catch(() => {
      // Analytics not supported in this environment
    });
}

export const getFirebaseAnalytics = () => analyticsInstance;
export { app };

/**
 * Standard Database Paths for Smart BMS
 */
export const DB_PATHS = {
  LATEST: 'smart_bms/latest',
  READINGS: 'smart_bms/readings',
  ALERTS: 'smart_bms/alerts',
  CONTROLS: 'smart_bms/controls',
  OLED: 'smart_bms/oled/message',
  ACTUATOR_EVENTS: 'smart_bms/actuator_events',
  REPORTS: 'smart_bms/reports',
  // Fallback compatibility paths for existing ESP8266 setups
  LEGACY_LATEST: 'telemetry/current',
  LEGACY_HISTORY: 'telemetry/history',
};
