import { CookieOptions, Response } from "express";
import { sevenDaysFromNow, thirtyDaysFromNow } from "./date";

export const REFRESH_PATH = "/auth/refresh";

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure: true,
};

type AuthCookiesParams = {
  rememberMe?: boolean,
  response: Response;
  refreshToken: string;
};

class CookiesManager {

  public setAuthCookies(params: AuthCookiesParams): void {
    const { response, refreshToken, rememberMe = false } = params;    

    response
      .cookie("refreshToken", refreshToken, rememberMe ? this.getRememberRefreshTokenCookieOptions() : this.getRefreshTokenCookieOptions());
  }

  public clearAuthCookies(response: Response): void {
    response
      .clearCookie("refreshToken", { path: REFRESH_PATH });
  }

  private getRememberRefreshTokenCookieOptions(): CookieOptions {
    return {
      ...DEFAULT_COOKIE_OPTIONS,
      expires: thirtyDaysFromNow(),
      path: REFRESH_PATH,
    };
  }

  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      ...DEFAULT_COOKIE_OPTIONS,
      expires: sevenDaysFromNow(),
      path: REFRESH_PATH,
    };
  }
}

export default CookiesManager;
