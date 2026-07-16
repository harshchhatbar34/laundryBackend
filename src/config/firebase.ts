import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let app: admin.app.App | null = null;

/**
 * Initializes Firebase Admin SDK.
 *
 * - In production (Vercel): reads credentials from FIREBASE_SERVICE_ACCOUNT_JSON env variable.
 * - In local development: reads from src/config/firebase-service-account.json file.
 *
 * Safe to call multiple times — only initializes once.
 */
export const getFirebaseAdmin = (): admin.app.App => {
  if (app) return app;

  let serviceAccount: admin.ServiceAccount;

  // 1. Try environment variable first (Vercel / production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('[Firebase] Loaded credentials from environment variable.');
    } catch (e) {
      throw new Error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable. Make sure it contains valid JSON.');
    }
  } else {
    // 2. Fall back to local file (local development)
    const serviceAccountPath = path.resolve(process.cwd(), 'src/config/firebase-service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `[Firebase] No credentials found. Either set the FIREBASE_SERVICE_ACCOUNT_JSON environment variable, ` +
        `or place firebase-service-account.json in src/config/.`
      );
    }
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    console.log('[Firebase] Loaded credentials from local file.');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('[Firebase] Admin SDK initialized successfully.');
  return app;
};

/**
 * Returns the Firebase Messaging instance.
 */
export const getFirebaseMessaging = (): admin.messaging.Messaging => {
  return getFirebaseAdmin().messaging();
};
