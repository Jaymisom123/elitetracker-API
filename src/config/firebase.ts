import admin from 'firebase-admin';

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
        // Lê as credenciais das variáveis de ambiente
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (!projectId || !clientEmail || !privateKey) {
          throw new Error('Credenciais do Firebase não encontradas nas variáveis de ambiente!');
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
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
