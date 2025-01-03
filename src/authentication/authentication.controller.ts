import { Request, Response, NextFunction, Router } from "express";
import GoogleAuth from "../utils/googleAuth";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateUserDto } from "../user/user.dto";
import { LogInDto } from "./login.dto";
import { ResetPasswordDto } from "./resetPassword.dto";
import { ForgetPasswordDto } from "./forgetPassword.dto";
import { ResetForgotenPasswordDto } from "./resetForgotenPassword.dto";
import AuthenticationService from "./authentication.service";
import VerificationsService from "./verifications.service";
import DataStoredInToken from "../interfaces/dataStoredInToken";
import { authMiddleware } from "../middleware/auth";
import { IUser } from "../user/user.interface";
import { RefreshAccessTokenDto } from "./refreshToken.dto";

export class AuthenticationController implements IController {
  public path = "/auth";
  public router = Router();
  public authenticationService = new AuthenticationService();
  public verificationService = new VerificationsService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/me`,
      authMiddleware,
      this.getMyProfile
    );
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
    this.router.get(`${this.path}/login-with-google`, GoogleAuth.authenticate(["profile", "email"]));
    this.router.get(`${this.path}/login-with-google/callback`, GoogleAuth.callbackAuth(), this.googleCallbackHandler);
    this.router.get(`${this.path}/failed`,  this.loginWithGoogleFailed);
    this.router.post(
      `${this.path}/resend/verification-code/:email`,
      this.resendVerificationCode
    );
    this.router.post(`${this.path}/refresh`, validationMiddleware(RefreshAccessTokenDto), this.refreshToken);
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
      response.status(201).send({user, message: "Ссылка для проверки отправлена на вашу электронную почту!"});
    } catch (error) {
      next(error);
    }
  };

  private getMyProfile = async (
    request: Request & { user?: DataStoredInToken },
    response: Response,
    next: NextFunction
  ) => {
    const userId = request.user?.userId
    
    try {
      const { user } = await this.authenticationService.getMe(userId);
      response.status(200).send(user);
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
    const { rememberMe } = request.query
    try {
      const result = await this.authenticationService.firstStepVerification(
        verificationId
      );

      if (result.redirect) {
        return response.redirect(result.redirect);
      }

      const { user } = result;

      response.redirect(
        `${
          process.env.APP_FRONT_URL
        }/stepVerification?email=${encodeURIComponent(user.email)}&rememberMe=${rememberMe}`
      );
    } catch (error) {
      next(error);
    }
  };

  private resendVerificationCode = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { email } = request.params;
    try {
      const { user } = await this.authenticationService.handleResendCode(email);
      response
        .status(201)
        .send({ user, message: "Ссылка для проверки отправлена на вашу электронную почту" });
    } catch (error) {
      next(error);
    }
  };

  private secondStepVerify = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { email, otpCode, rememberMe }: { email: string; otpCode: string, rememberMe: boolean } = request.body;
    try {
      const { user, accessToken, refreshToken } =
        await this.authenticationService.secondStepVerification(email, otpCode, rememberMe);

      response.status(200).send({ accessToken, user, refreshToken });
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
      const { accessToken, refreshToken, user, status, message } =
        await this.authenticationService.login(logInData);

      response.status(status).send({ accessToken, refreshToken, user, message});
    } catch (error) {
      next(error);
    }
  };

  private googleCallbackHandler = async (request:Request & { user?: IUser }, response: Response, next: NextFunction) => {
    try {
      const {refreshToken, accessToken } = await this.authenticationService.googleCbHandler(request.user);

      response.redirect(`${process.env.APP_FRONT_URL}/success/with-google?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      next(error);
    }
  }

  private loginWithGoogleFailed = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      response.redirect(`${process.env.APP_FRONT_URL}/failed/with-google`);
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
      const { refreshToken, rememberMe } = request.body as { refreshToken: string | undefined, rememberMe: boolean }      

      const { newAccessToken, newRefreshToken } =
        await this.authenticationService.refreshUserAccesToken(refreshToken, rememberMe);

      response.status(200).send({
        message: "Токены успешно обновлены.",
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      next(error);
    }
  };

  private resetPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const resetPasswordData: ResetPasswordDto = request.body;

      await this.authenticationService.resetUserPassword(resetPasswordData);

      response.status(200).send({ message: "Пароль успешно сброшен."});
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

      const { user } = await this.authenticationService.sendPasswordResetUrl(
        forgetPasswordData
      );

      response.status(200).send({
        message: `На вашу ${user.email} электронную почту отправлено письмо для сброса пароля.`,
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

      await this.authenticationService.resetForgetPassword(
        resetForgotenPasswordData
      );

      response.status(200).send({ message: "Пароль успешно сброшен." });
    } catch (error) {
      next(error);
    }
  };
}
