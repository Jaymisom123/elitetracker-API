import { Request } from 'express';

export function getUserId(req: Request): string | null {
  // Firebase Auth - req.user.uid
  if (req.user && req.user.uid) {
    return req.user.uid;
  }

  // JWT Auth - req.userId
  if (req.userId) {
    return req.userId;
  }

  return null;
}

export function getUserInfo(req: Request) {
  // Firebase Auth
  if (req.user) {
    return {
      id: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      provider: 'firebase',
    };
  }

  // JWT Auth
  if (req.userId) {
    return {
      id: req.userId,
      provider: 'jwt',
    };
  }

  return null;
}
