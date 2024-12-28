import { Response } from "express";
import { UserWithThatEmailAlreadyExistsException } from "../exceptions/userWithThatEmailAlreadyExists.exception";
import { NotFoundException } from "../exceptions/notfound.exception";
import { UserNotFoundException } from "../exceptions/userNotFound.exception";
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
import EmailService from "../utils/email.service";

class AuthenticationService {
  public user = userModel;
  public verificationCode = verificationCodeModel;
  private emailService = new EmailService();
  public verificationService = new VerificationsService();
  private tokenManager = new TokenManager();
  private otp = otpCodeModel;
  public;


  public async getMe(userId: string){
    const user = await this.user.findById(userId);
    return { user }
  }

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

  public async firstStepVerification(verificationId: string) {
    const validCode = await this.verificationCode.findOne({
      _id: verificationId,
      type: VerificationCode.EmailVerification,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      return {
        redirect: `${
          process.env.APP_FRONT_URL
        }/verification-error?message=${encodeURIComponent(
          "Invalid or expired verification code"
        )}`,
      };
    }

    const user = await this.user.findById(validCode.userId);
    if (!user) {
      return {
        redirect: `${
          process.env.APP_FRONT_URL
        }/verification-error?message=${encodeURIComponent(
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

  public async secondStepVerification(email: string, otpCode: string) {
    const storedOtp = await this.otp.findOne({ email });
    if (!storedOtp || new Date() > storedOtp.expiresAt) {
      throw new NotFoundException("Invalid or expired OTP code");
    }

    const isValidOtp = await compareValue(otpCode, storedOtp.otp);
    if (!isValidOtp) {
      throw new NotFoundException("Invalid OTP");
    }

    const user = await this.user.findOneAndUpdate(
      { email },
      { isEmailConfirmed: true },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException("User not found");
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

  public async handleResendCode(email: string) {
    const user = await this.user.findOne({ email });

    if (!user) {
      throw new NotFoundException("User not found with this email");
    }

    await this.verificationCode.findOneAndDelete({
      userId: user._id,
      type: VerificationCode.EmailVerification,
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

  public async login(logInData: LogInDto, response: Response) {
    const user = await this.user.findOne({ email: logInData.email });

    if (!user) {
      throw new NotFoundException("User not found with this email");
    }

    const isPasswordMatching = await compareValue(
      logInData.password,
      user.get("password", null, { getters: false })
    );

    if (!isPasswordMatching) {
      throw new NotFoundException("Incorrect password. Please try again.");
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
        user,
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

    return { accessToken, refreshToken, user };
  }

  public async loginWithGoogle(profile) {
    let user = await this.user.findOne({ email: profile._json?.email });    

    if (user) {
      return { user };
    }

    user = await this.user.create({
      name: profile._json?.given_name,
      email: profile._json?.email,
      isEmailConfirmed: profile._json?.email_verified,
      image: profile._json?.picture,
    });
    return { user };
  }

  public async refreshUserAccesToken(refreshToken: string) {
    if (!refreshToken) {
      throw new NotFoundException("Refresh token is missing.");
    }

    const { payload, error } = this.tokenManager.verifyToken<DataStoredInToken>(
      refreshToken,
      {
        secret: this.tokenManager.refreshTokenSignOptions.secret,
      }
    );

    if (error) {
      throw new NotFoundException("Invalid or expired refresh token.");
    }

    if (!payload) {
      throw new NotFoundException("Invalid token payload.");
    }

    const userId = payload.userId;
    const user = await this.user.findById(userId);
    if (!user) {
      throw new NotFoundException("Invalid token payload.");
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
      newRefreshToken,
    };
  }

  public async resetUserPassword(resetPasswordData: ResetPasswordDto) {
    const { email, oldPassword, password, confirmPassword } = resetPasswordData;

    const user = await this.user.findOne({ email });
    if (!user) {
      throw new NotFoundException("User not found with this email");
    }

    const isPasswordMatching = await compareValue(
      oldPassword,
      user.get("password", null, { getters: false })
    );

    if (!isPasswordMatching) {
      throw new NotFoundException("Incorrect old password");
    }

    if (password !== confirmPassword) {
      throw new NotFoundException("Passwords do not match");
    }

    user.password = await hashValue(password);
    await user.save();
  }

  public async sendPasswordResetUrl(forgetPasswordData: ForgetPasswordDto) {
    const { email } = forgetPasswordData;

    const user = await this.user.findOne({ email });
    if (!user) {
      throw new NotFoundException("User not found with this email");
    }

    const recentRequest = await this.verificationCode.countDocuments({
      userId: user._id,
      type: VerificationCode.PasswordReset,
      createdAt: { $gt: fiveMinutesAgo() },
    });

    if (recentRequest >= 1) {
      throw new NotFoundException("Too many requests, please try again later");
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
      user,
    };
  }

  public async resetForgetPassword(
    resetForgotenPasswordData: ResetForgotenPasswordDto
  ) {
    const { verificationCode, password } = resetForgotenPasswordData;

    const validCode = await this.verificationCode.findOne({
      _id: verificationCode,
      type: VerificationCode.PasswordReset,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      throw new NotFoundException("Invalid or expired verification code");
    }

    const hashedPassword = await hashValue(password);

    const updatedUser = await this.user.findByIdAndUpdate(validCode.userId, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      throw new UserNotFoundException(String(validCode.userId));
    }

    await validCode.deleteOne();
  }
}

export default AuthenticationService;
