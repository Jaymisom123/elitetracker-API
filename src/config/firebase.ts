import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

class FirebaseConfig {
  private static instance: FirebaseConfig;
  private initialized = false;

  private constructor() {}

  public static getInstance(): FirebaseConfig {
    if (!FirebaseConfig.instance) {
      FirebaseConfig.instance = new FirebaseConfig();
    }
    return FirebaseConfig.instance;
  }

  public initialize(): void {
    if (this.initialized) {
      console.log('🔥 Firebase already initialized');
      return;
    }

    try {
      if (admin.apps.length === 0) {
        const credentialsPath =
          process.env.FIREBASE_CREDENTIALS_PATH ||
          './elite-tracker-9b1db-firebase-adminsdk-fbsvc-e0e440e65c.json';

        const serviceAccount = JSON.parse(
          readFileSync(path.resolve(credentialsPath), 'utf8')
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId:
            process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        });

        this.initialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      throw error;
    }
  }

  public getAuth() {
    if (!this.initialized) {
      this.initialize();
    }
    return admin.auth();
  }

  public getFirestore() {
    if (!this.initialized) {
      this.initialize();
    }
    return admin.firestore();
  }

  public async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await this.getAuth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw error;
    }
  }
}

export const firebaseConfig = FirebaseConfig.getInstance();
