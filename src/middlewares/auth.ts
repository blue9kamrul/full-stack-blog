import { auth as betterAuth } from "../lib/auth";
import { NextFunction, Request, Response } from "express";

export enum userRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
        role: string;
        emailVerified: boolean;
      };
    }
  }
}

const auth = (...allowedRoles: userRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await betterAuth.api.getSession({
        headers: req.headers as any,
      });
      if (!session) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }
      if (!session.user.emailVerified) {
        return res
          .status(403)
          .json({ success: false, message: "Email not verified" });
      }

      req.user = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        role: session.user.role as string,
        emailVerified: session.user.emailVerified,
      };

      if (
        allowedRoles.length &&
        !allowedRoles.includes(req.user.role.toUpperCase() as userRole)
      ) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions",
        });
      }

      next();
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  };
};

export default { auth };
