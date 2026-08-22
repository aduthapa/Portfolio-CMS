import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userRole?: "ADMIN" | "EDITOR";
    userName?: string;
    returnTo?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: number;
        name: string;
        email: string;
        role: "ADMIN" | "EDITOR";
        avatarUrl: string | null;
      };
    }
  }
}

export {};
