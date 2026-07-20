import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let app: admin.app.App | null = null;

/**
 * Initializes Firebase Admin SDK.
 *
 * - In production (Vercel): reads credentials from individual FIREBASE_* env variables.
 * - In local development: reads from src/config/firebase-service-account.json file.
 *
 * Safe to call multiple times — only initializes once.
 */
export const getFirebaseAdmin = (): admin.app.App => {
  if (app) return app;

  let serviceAccount: admin.ServiceAccount;

  // 1. Try individual environment variables first (Vercel / production)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    serviceAccount = {
      type:                        process.env.FIREBASE_TYPE || 'service_account',
      projectId:                   process.env.FIREBASE_PROJECT_ID,
      privateKeyId:                process.env.FIREBASE_PRIVATE_KEY_ID,
      // Vercel escapes \n in env vars — replace \\n back to actual newlines
      privateKey:                  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      clientEmail:                 process.env.FIREBASE_CLIENT_EMAIL,
      clientId:                    process.env.FIREBASE_CLIENT_ID,
      authUri:                     process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      tokenUri:                    process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      authProviderX509CertUrl:     process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      clientX509CertUrl:           process.env.FIREBASE_CLIENT_CERT_URL,
    } as admin.ServiceAccount;
    console.log('[Firebase] Loaded credentials from individual environment variables.');
  } else {
    // 2. Fall back to local file (local development)
    const serviceAccountPath = path.resolve(process.cwd(), 'src/config/firebase-service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `[Firebase] No credentials found. Either set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL ` +
        `environment variables, or place firebase-service-account.json in src/config/.`
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
