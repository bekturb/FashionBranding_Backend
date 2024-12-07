import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";

export const REFRESH_PATH = "/auth/refresh";

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  sameSite: "strict",
  httpOnly: true,
  secure: true,
};

type AuthCookiesParams = {
  response: Response;
  accessToken: string;
  refreshToken: string;
};

class CookiesManager {

  public setAuthCookies(params: AuthCookiesParams): void {
    const { response, accessToken, refreshToken } = params;

    response
      .cookie("accessToken", accessToken, this.getAccessTokenCookieOptions())
      .cookie("refreshToken", refreshToken, this.getRefreshTokenCookieOptions());
  }

  public clearAuthCookies(response: Response): void {
    response
      .clearCookie("accessToken")
      .clearCookie("refreshToken", { path: REFRESH_PATH });
  }

  private getAccessTokenCookieOptions(): CookieOptions {
    return {
      ...DEFAULT_COOKIE_OPTIONS,
      expires: fifteenMinutesFromNow(),
    };
  }

  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      ...DEFAULT_COOKIE_OPTIONS,
      expires: thirtyDaysFromNow(),
      path: REFRESH_PATH,
    };
  }
}

export default CookiesManager;
