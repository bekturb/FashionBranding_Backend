import { UserWithThatEmailAlreadyExistsException } from "../exceptions/userWithThatEmailAlreadyExists.exception";
import { NotFoundException } from "../exceptions/notfound.exception";
import { UserNotFoundException } from "../exceptions/userNotFound.exception";
import { WrongCredentialsException } from "../exceptions/wrongCredentials.exception";
import { CreateUserDto } from "../user/user.dto";
import { LogInDto } from "./login.dto";
import { ResetPasswordDto } from "./resetPassword.dto";
import { ForgetPasswordDto } from "./forgetPassword.dto";
import { ResetForgotenPasswordDto } from "./resetForgotenPassword.dto";
import { userModel } from "../user/user.model";
import { otpCodeModel, verificationCodeModel } from "./verification.model";
import { compareValue, hashValue } from "../utils/bcrypt";
import { fiveMinutesAgo, oneHourFromNow, oneYearFromNow } from "../utils/date";
import TokenManager from "../utils/jwt";
import VerificationCode from "./enum/verificationCode.enum";
import DataStoredInToken from "../interfaces/dataStoredInToken";
import VerificationsService from "./verifications.service";
import EmailService from "./email.service";
import { NextFunction, Response } from "express";

class AuthenticationService {
  public user = userModel;
  public verificationCode = verificationCodeModel;
  private emailService = new EmailService();
  public verificationService = new VerificationsService();
  private tokenManager = new TokenManager();
  private otp = otpCodeModel;
  public;

  public async register(userData: CreateUserDto) {
    if (await this.user.findOne({ email: userData.email })) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    const hashedPassword = await hashValue(userData.password);
    const user = await this.user.create({
      ...userData,
      password: hashedPassword,
    });

    const verificationCode = await this.verificationCode.create({
      userId: user._id,
      type: VerificationCode.EmailVerification,
      expiresAt: oneYearFromNow(),
    });

    const url = `${process.env.APP_URL}/auth/email/verify/${verificationCode._id}`;

    await this.emailService.sendVerificationEmail(user.email, url);
    return {
      user,
    };
  }

  public async firstStepVerification(
    verificationId: string,
    next: NextFunction
  ) {
    const validCode = await this.verificationCode.findOne({
      _id: verificationId,
      type: VerificationCode.EmailVerification,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      return {
        redirect: `${process.env.APP_FRONT_URL}/verification-error?message=${encodeURIComponent(
          "Invalid or expired verification code"
        )}`,
      };
    }

    const user = await this.user.findById(validCode.userId);
    if (!user) {
      return {
        redirect: `${process.env.APP_FRONT_URL}/verification-error?message=${encodeURIComponent(
          `User not found for ID ${validCode.userId}`
        )}`,
      };
    }

    const otp = await this.verificationService.generateOtpCode(user);
    await this.emailService.sendVerificationOtp(user.email, otp);

    await validCode.deleteOne();

    return {
      user,
    };
  }

  public async secondStepVerification(
    email: string,
    otpCode: string,
    next: NextFunction
  ) {
    const storedOtp = await this.otp.findOne({ email });
    if (!storedOtp || new Date() > storedOtp.expiresAt) {
      next(new NotFoundException("Invalid or expired OTP code"));
    }

    const isValidOtp = await compareValue(otpCode, storedOtp.otp);
    if (!isValidOtp) {
      next(new NotFoundException("Invalid OTP"));
    }

    const user = await this.user.findOneAndUpdate(
      { email },
      { isEmailConfirmed: true },
      { new: true }
    );
   
    if (!user) {
      next(new NotFoundException("User not found"));
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

    return {
      user,
      refreshToken,
      accessToken,
    };
  }

  public async login(
    logInData: LogInDto,
    response: Response,
    next: NextFunction
  ) {
    const user = await this.user.findOne({ email: logInData.email });

    if (!user) {
      next(new WrongCredentialsException());
    }

    const isPasswordMatching = await compareValue(
      logInData.password,
      user.get("password", null, { getters: false })
    );

    if (!isPasswordMatching) {
      next(new NotFoundException("Incorrect password. Please try again."));
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

    return { accessToken, refreshToken, user }
  }

  public async refreshUserAccesToken (refreshToken: string, next: NextFunction){
    if (!refreshToken) {
      next(new NotFoundException("Refresh token is missing."));
    }

    const { payload, error } =
      this.tokenManager.verifyToken<DataStoredInToken>(refreshToken, {
        secret: this.tokenManager.refreshTokenSignOptions.secret,
      });

    if (error) {
      next(new NotFoundException("Invalid or expired refresh token."));
    }

    if (!payload) {
      next(new NotFoundException("Invalid token payload."));
    }

    const userId = payload.userId;
    const user = await this.user.findById(userId);
    if (!user) {
      next(new UserNotFoundException(userId));
    }

    const newAccessToken = this.tokenManager.signToken(
      { userId: user._id },
      this.tokenManager.accessTokenSignOptions
    );

    const newRefreshToken = this.tokenManager.signToken(
      { userId: user._id },
      this.tokenManager.refreshTokenSignOptions
    );

    return {
      newAccessToken,
      newRefreshToken
    }
  }

  public async resetUserPassword (resetPasswordData: ResetPasswordDto, next: NextFunction, ){

    const {email, oldPassword, password, confirmPassword} = resetPasswordData;

    const user = await this.user.findOne({ email });
      if (!user) {
        next(new NotFoundException("User not found with this email"));
      }

      const isPasswordMatching = await compareValue(
        oldPassword,
        user.get("password", null, { getters: false })
      );

      if (!isPasswordMatching) {
        next(new NotFoundException("Incorrect old password"));
      }

      if (password !== confirmPassword) {
        next(new NotFoundException("Passwords do not match"));
      }

      user.password = await hashValue(password);
      await user.save();
  }

  public async sendPasswordResetUrl (forgetPasswordData: ForgetPasswordDto, next){
    const { email } = forgetPasswordData;

    const user = await this.user.findOne({ email });
      if (!user) next(new NotFoundException("User not found with this email"));

      const recentRequest = await this.verificationCode.countDocuments({
        userId: user._id,
        type: VerificationCode.PasswordReset,
        createdAt: { $gt: fiveMinutesAgo() },
      });

      if (recentRequest >= 1) {
        next(
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

      return {
        user
      }
  }

  public async resetForgetPassword (resetForgotenPasswordData: ResetForgotenPasswordDto, next: NextFunction){
          const { verificationCode, password } = resetForgotenPasswordData;

    const validCode = await this.verificationCode.findOne({
      _id: verificationCode,
      type: VerificationCode.PasswordReset,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      next(new NotFoundException("Invalid or expired verification code"));
    }

    const hashedPassword = await hashValue(password);

    const updatedUser = await this.user.findByIdAndUpdate(validCode.userId, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      next(new NotFoundException("User not found or password reset failed"));
    }

    await validCode.deleteOne();
  }
}

export default AuthenticationService;
