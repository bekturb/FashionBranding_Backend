import * as bcrypt from "bcrypt";
import mongoose, { Error } from "mongoose";
import { Request, Response, NextFunction, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateUserDto } from "../user/user.dto";
import { userModel } from "../user/user.model";
import AuthenticationService from "./authentication.service";
import { LogInDto } from "./login.dto";
import { NotFoundException } from "../exceptions/notfound.exception";
import { otpCodeModel, verificationCodeModel } from "./verification.model";
import { UserNotFoundException } from "../exceptions/userNotFound.exception";
import VerificationsService from "./verifications.service";
import EmailService from "./email.service";
import WrongCredentialsException from "../exceptions/WrongCredentialsException";
import TokenManager from "../utils/jwt";
import CookiesManager from "../utils/cookies";
import DataStoredInToken from "interfaces/dataStoredInToken";
import { ResetPasswordDto } from "./resetPassword.dto";
import { ForgetPasswordDto } from "./forgetPassword.dto";
import { fiveMinutesAgo, oneHourFromNow, oneYearFromNow } from "../utils/date";
import VerificationCode from "./enum/verificationCode.enum";
import { ResetForgotenPasswordDto } from "./resetForgotenPassword.dto";

export class AuthenticationController implements IController {
  public path = "/auth";
  public router = Router();
  public authenticationService = new AuthenticationService();
  public verificationService = new VerificationsService();
  private emailService = new EmailService();
  private tokenManager = new TokenManager();
  private cookiesManager = new CookiesManager();
  private user = userModel;
  private verificationCode = verificationCodeModel;
  private otp = otpCodeModel;

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
      this.sendPasswordResetEmail
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
    try {
      const { verificationId } = request.params;

      if (!mongoose.Types.ObjectId.isValid(verificationId)) {
        return next(new NotFoundException("Invalid Id"));
      }

      const validCode = await this.verificationCode.findOne({
        _id: verificationId,
        type: VerificationCode.EmailVerification,
        expiresAt: { $gt: new Date() },
      });

      if (!validCode) {
        return next(
          new NotFoundException("Invalid or expired verification code")
        );
      }

      const user = await this.user.findById(validCode.userId);
      if (!user) {
        return next(new UserNotFoundException(String(validCode.userId)));
      }

      const otp = await this.verificationService.generateOtpCode(user);
      await this.emailService.sendVerificationOtp(user.email, otp);

      await validCode.deleteOne();

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
    try {
      const { email, otpCode }: { email: string; otpCode: string } =
        request.body;

      const storedOtp = await this.otp.findOne({ email });
      if (!storedOtp || new Date() > storedOtp.expiresAt) {
        return next(new NotFoundException("Invalid or expired OTP code"));
      }

      const isValidOtp = bcrypt.compareSync(otpCode, storedOtp.otp);
      if (!isValidOtp) {
        return next(new NotFoundException("Invalid OTP"));
      }

      const user = await this.user.findOneAndUpdate(
        { email },
        { isEmailConfirmed: true },
        { new: true }
      );

      if (!user) {
        return next(new NotFoundException("User not found"));
      }
      const refreshToken = this.tokenManager.signToken(
        {
          userId: user._id,
        },
        this.tokenManager.refreshTokenSignOptions
      );

      const accessToken = this.tokenManager.signToken({
        userId: user._id,
      });

      await this.otp.deleteOne({ email });

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
    try {
      const logInData: LogInDto = request.body;
      const user = await this.user.findOne({ email: logInData.email });

      if (!user) {
        next(new WrongCredentialsException());
        return;
      }

      const isPasswordMatching = await bcrypt.compare(
        logInData.password,
        user.get("password", null, { getters: false })
      );

      if (!isPasswordMatching) {
        next(new NotFoundException("Incorrect password. Please try again."));
        return;
      }

      if (!user.isEmailConfirmed) {
        const verificationCode = await this.verificationCode.create({
          userId: user._id,
          type: VerificationCode.EmailVerification,
          expiresAt: oneYearFromNow(),
        });
        const url = `${process.env.APP_URL}/auth/email/verify/${verificationCode._id}`;

        await this.emailService.sendVerificationEmail(user.email, url);

        response.status(403).send({
          message: `User is not verified. A new verification email has been sent to ${user.email}.`,
        });
        return;
      }

      const refreshToken = this.tokenManager.signToken(
        {
          userId: user._id,
        },
        this.tokenManager.refreshTokenSignOptions
      );

      const accessToken = this.tokenManager.signToken({
        userId: user._id,
      });

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

      if (!refreshToken) {
        return next(new NotFoundException("Refresh token is missing."));
      }

      const { payload, error } =
        this.tokenManager.verifyToken<DataStoredInToken>(refreshToken, {
          secret: this.tokenManager.refreshTokenSignOptions.secret,
        });

      if (error) {
        return next(new NotFoundException("Invalid or expired refresh token."));
      }

      if (!payload) {
        return next(new NotFoundException("Invalid token payload."));
      }

      const userId = payload.userId;
      const user = await this.user.findById(userId);
      if (!user) {
        return next(new UserNotFoundException(userId));
      }

      const newAccessToken = this.tokenManager.signToken(
        { userId: user._id },
        this.tokenManager.accessTokenSignOptions
      );

      const newRefreshToken = this.tokenManager.signToken(
        { userId: user._id },
        this.tokenManager.refreshTokenSignOptions
      );

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
      const {
        email,
        oldPassword,
        password,
        confirmPassword,
      }: ResetPasswordDto = request.body;

      const user = await this.user.findOne({ email });
      if (!user) {
        return next(new NotFoundException("User not found with this email"));
      }

      const isPasswordMatching = await bcrypt.compare(
        oldPassword,
        user.get("password", null, { getters: false })
      );

      if (!isPasswordMatching) {
        return next(new NotFoundException("Incorrect old password"));
      }

      if (password !== confirmPassword) {
        return next(new NotFoundException("Passwords do not match"));
      }

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      response.status(200).send({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };

  private sendPasswordResetEmail = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { email }: ForgetPasswordDto = request.body;

      const user = await this.user.findOne({ email });
      if (!user)
        return next(new NotFoundException("User not found with this email"));

      const recentRequest = await this.verificationCode.countDocuments({
        userId: user._id,
        type: VerificationCode.PasswordReset,
        createdAt: { $gt: fiveMinutesAgo() },
      });

      if (recentRequest >= 1) {
        return next(
          new NotFoundException("Too many requests, please try again later")
        );
      }

      const expiresAt = oneHourFromNow();
      const verificationCode = await this.verificationCode.create({
        userId: user._id,
        type: VerificationCode.PasswordReset,
        expiresAt,
      });

      const url = `${process.env.APP_URL}/password/reset?code=${
        verificationCode._id
      }&exp=${expiresAt.getTime()}`;
      await this.emailService.sendResetPassworUrl(user.email, url);

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
      const { verificationCode, password }: ResetForgotenPasswordDto = request.body;

      const validCode = await this.verificationCode.findOne({
        _id: verificationCode,
        type: VerificationCode.PasswordReset,
        expiresAt: { $gt: new Date() },
      });

      if (!validCode) {
        return next(
          new NotFoundException("Invalid or expired verification code")
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const updatedUser = await this.user.findByIdAndUpdate(validCode.userId, {
        password: hashedPassword,
      });

      if (!updatedUser) {
        return next(
          new NotFoundException("User not found or password reset failed")
        );
      }

      await validCode.deleteOne();

      this.cookiesManager.clearAuthCookies(response);

      response.status(200).send({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };
}
