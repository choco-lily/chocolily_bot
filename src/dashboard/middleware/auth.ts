import { Request, Response, NextFunction } from 'express';

// 사용자 인증 확인 미들웨어
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/discord');
}

// Express와 Passport의 타입 확장
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      discriminator: string;
      avatar: string | null;
      guilds: Array<{
        id: string;
        name: string;
        icon: string | null;
        owner: boolean;
        permissions: number;
        features: string[];
      }>;
    }
  }
} 