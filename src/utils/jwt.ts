import * as jwt from "jsonwebtoken";
import { SignOptions, VerifyOptions } from "jsonwebtoken";
import {UserRole} from "../user/enum/role.enum";
import DataStoredInToken from "interfaces/dataStoredInToken";

const defaults: SignOptions = {
  audience: [UserRole.ADMIN],
};

class TokenManager {
  public accessTokenSignOptions: SignOptions & { secret: string } = {
    expiresIn: "15m",
    secret: process.env.JWT_SECRET,
  };

  public rememberRefreshTokenSignOptions: SignOptions & { secret: string } = {
    expiresIn: "30d",
    secret: process.env.JWT_REFRESH_SECRET,
  };

  public refreshTokenSignOptions: SignOptions & { secret: string } = {
    expiresIn: "7d",
    secret: process.env.JWT_REFRESH_SECRET,
  };

  public signToken(
    payload: DataStoredInToken,
    options?: SignOptions & { secret: string }
  ): string {
    const { secret, ...signOpts } = options || this.accessTokenSignOptions;    
    return jwt.sign(payload, secret, { ...defaults, ...signOpts });
  }

  public verifyToken<TPayload extends object = DataStoredInToken>(
    token: string,
    options?: VerifyOptions & { secret?: string }
  ): { payload?: TPayload; error?: string } {
    const { secret = process.env.JWT_SECRET, ...verifyOpts } = options || {};
    try {
      const payload = jwt.verify(token, secret, { ...defaults, ...verifyOpts }) as TPayload;
      return { payload };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  public refreshAccessToken(
    refreshToken: string
  ): { accessToken?: string; error?: string } {
    const { payload, error } = this.verifyToken<DataStoredInToken>(refreshToken, {
      secret: this.refreshTokenSignOptions.secret,
    });

    if (error || !payload) {
      return { error: "Неверный или истекший токен обновления." };
    }

    const newAccessToken = this.signToken(
      { userId: payload.userId },
      this.accessTokenSignOptions
    );

    return { accessToken: newAccessToken };
  }
}

export default TokenManager;
