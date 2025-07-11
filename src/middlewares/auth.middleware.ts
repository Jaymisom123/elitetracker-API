import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

interface JwtPayload {
  id: string;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authToken = req.headers.authorization;
  if (!authToken) {
    res.status(401).json({ message: 'Token not provided' });
    return;
  }
  const token = authToken.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Token not provided' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const payload = decoded as JwtPayload;
    if (!payload || !payload.id) {
      res.status(401).json({ message: 'Malformed token' });
      return;
    }
    req.userId = payload.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
}

export default authMiddleware;
