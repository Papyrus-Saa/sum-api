import 'express';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
    }

    interface Request {
      requestId?: string;
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export {};
