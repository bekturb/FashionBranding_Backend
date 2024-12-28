import { NextFunction, Request, Response } from "express";
import { HttpException } from "../exceptions/http.exception";
import TokenManager from "../utils/jwt";
import DataStoredInToken from "../interfaces/dataStoredInToken";

const tokenManager = new TokenManager();

export function authMiddleware(
     req: Request & { user?: DataStoredInToken },
     res: Response, 
     next: NextFunction) {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      throw new HttpException(401, "Authorization header is missing");
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new HttpException(400, "Invalid Authorization format");
    }

    const { payload, error } = tokenManager.verifyToken(token, {
      secret: process.env.JWT_SECRET,
    });

    if (error) {
      throw new HttpException(401, `Invalid token: ${error}`);
    }

    req.user = payload    
    
    next();
  } catch (err) {
    next(err);
  }
}
