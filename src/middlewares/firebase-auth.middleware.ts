import { NextFunction, Request, Response } from 'express';

import { firebaseConfig } from '../config/firebase';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      uid: string;
      email?: string;
      name?: string;
    };
  }
}

export async function firebaseAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Authorization header missing or malformed',
      });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      res.status(401).json({
        message: 'Firebase ID token not provided',
      });
      return;
    }

    // Verify the Firebase ID token
    const decodedToken = await firebaseConfig.verifyIdToken(idToken);

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };

    next();
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(401).json({
      message: 'Invalid or expired Firebase token',
    });
    return;
  }
}

export default firebaseAuthMiddleware;
