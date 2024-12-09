import { Request, Response, NextFunction, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateUserDto } from "../user/user.dto";
import { LogInDto } from "./login.dto";
import { ResetPasswordDto } from "./resetPassword.dto";
import { ForgetPasswordDto } from "./forgetPassword.dto";
import { ResetForgotenPasswordDto } from "./resetForgotenPassword.dto";
import AuthenticationService from "./authentication.service";
import VerificationsService from "./verifications.service";
import CookiesManager from "../utils/cookies";

export class AuthenticationController implements IController {
  public path = "/auth";
  public router = Router();
  public authenticationService = new AuthenticationService();
  public verificationService = new VerificationsService();
  private cookiesManager = new CookiesManager();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/register`,
      validationMiddleware(CreateUserDto),
      this.registration
    );
    this.router.get(
      `${this.path}/email/verify/:verificationId`,
      this.firstStepVerify
    );
    this.router.post(`${this.path}/email/verify`, this.secondStepVerify);
    this.router.post(
      `${this.path}/login`,
      validationMiddleware(LogInDto),
      this.loggingIn
    );
    this.router.get(`${this.path}/refresh`, this.refreshToken);
    this.router.post(`${this.path}/logout`, this.loggingOut);
    this.router.post(
      `${this.path}/password/reset`,
      validationMiddleware(ResetPasswordDto),
      this.resetPassword
    );
    this.router.post(
      `${this.path}/forget/password`,
      validationMiddleware(ForgetPasswordDto),
      this.sendPasswordReset
    );
    this.router.post(
      `${this.path}/reset/forgoten/password`,
      validationMiddleware(ResetForgotenPasswordDto),
      this.resetForgotenPassword
    );
  }

  private registration = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const userData: CreateUserDto = request.body;
    try {
      const { user } = await this.authenticationService.register(userData);
      response.send(user);
    } catch (error) {
      next(error);
    }
  };

  private firstStepVerify = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { verificationId } = request.params;
    try {
      const { user } = await this.authenticationService.firstStepVerification(
        verificationId,
        next
      );

      response.status(200).send({
        message: `Verification OTP code sent to ${user.email}`,
      });
    } catch (error) {
      next(error);
    }
  };

  private secondStepVerify = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { email, otpCode }: { email: string; otpCode: string } = request.body;
    try {

      const { user, accessToken, refreshToken } =
        await this.authenticationService.secondStepVerification(
          email,
          otpCode,
          next
        );

      this.cookiesManager.setAuthCookies({
        response,
        accessToken,
        refreshToken,
      });

      response.status(200).send({ accessToken, refreshToken, user });
    } catch (error) {
      next(error);
    }
  };

  private loggingIn = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const logInData: LogInDto = request.body;

    try {      

      const { accessToken, refreshToken, user } = await this.authenticationService.login(logInData, response, next)

      this.cookiesManager.setAuthCookies({
        response,
        accessToken,
        refreshToken,
      });

      response.status(200).send({ accessToken, refreshToken, user });
    } catch (error) {
      next(error);
    }
  };

  private loggingOut = (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      this.cookiesManager.clearAuthCookies(response);
      response.status(200).send({ message: "Logout successful" });
    } catch (error) {
      next(error);
    }
  };

  private refreshToken = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = request.cookies.refreshToken as string | undefined;

      const { newAccessToken, newRefreshToken } = await this.authenticationService.refreshUserAccesToken(refreshToken, next)

      this.cookiesManager.setAuthCookies({
        response,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      response.status(200).send({
        message: "Tokens refreshed successfully.",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      next(Error);
    }
  };

  private resetPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const resetPasswordData: ResetPasswordDto = request.body;

      await this.authenticationService.resetUserPassword(resetPasswordData, next)

      response.status(200).send({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };

  private sendPasswordReset = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const forgetPasswordData: ForgetPasswordDto = request.body;

      const { user } = await this.authenticationService.sendPasswordResetUrl(forgetPasswordData, next)

      response.status(200).send({
        message: `A password reset email has been sent to ${user.email}.`,
      });
    } catch (error) {
      next(error);
    }
  };

  private resetForgotenPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const resetForgotenPasswordData: ResetForgotenPasswordDto = request.body;

      await this.authenticationService.resetForgetPassword(resetForgotenPasswordData, next)
      this.cookiesManager.clearAuthCookies(response);

      response.status(200).send({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };
}
