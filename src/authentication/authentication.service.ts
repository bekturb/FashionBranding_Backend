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
import { IUser } from "../user/user.interface";

class AuthenticationService {
  public user = userModel;
  public verificationCode = verificationCodeModel;
  public emailService = new EmailService();
  public verificationService = new VerificationsService();
  public tokenManager = new TokenManager();
  public otp = otpCodeModel;
  public;

  public async getMe(userId: string) {
    const user = await this.user.findById(userId);
    return { user };
  }

  public async register(userData: CreateUserDto) {

    const {email, password, rememberMe} = userData;

    if (await this.user.findOne({ email: email })) {
      throw new UserWithThatEmailAlreadyExistsException(email);
    }
    const hashedPassword = await hashValue(password);
    const user = await this.user.create({
      ...userData,
      password: hashedPassword,
    });

    const verificationCode = await this.verificationCode.create({
      userId: user._id,
      type: VerificationCode.EmailVerification,
      expiresAt: oneYearFromNow(),
    });

    const url = `${process.env.APP_URL}/auth/email/verify/${verificationCode._id}?rememberMe=${rememberMe}`;

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
          "Неверный или истекший код подтверждения."
        )}`,
      };
    }

    const user = await this.user.findById(validCode.userId);
    if (!user) {
      return {
        redirect: `${
          process.env.APP_FRONT_URL
        }/verification-error?message=${encodeURIComponent(
          `Пользователь с таким ID ${validCode.userId} не найден.`
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

  public async secondStepVerification(email: string, otpCode: string, rememberMe: boolean = false) {
    const storedOtp = await this.otp.findOne({ email });
    if (!storedOtp || new Date() > storedOtp.expiresAt) {
      throw new NotFoundException("Неверный или истекший код OTP.");
    }

    const isValidOtp = await compareValue(otpCode, storedOtp.otp);
    if (!isValidOtp) {
      throw new NotFoundException("Неверный OTP код.");
    }

    const user = await this.user.findOneAndUpdate(
      { email },
      { isEmailConfirmed: true },
      { new: true }
    );

    if (!user) {
      throw new NotFoundException("Пользователь не найден.");
    }
    const refreshToken = this.tokenManager.signToken(
      {
        userId: user._id,
      },
      rememberMe ? this.tokenManager.rememberRefreshTokenSignOptions : this.tokenManager.refreshTokenSignOptions
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

  public async googleCbHandler(user: IUser) {
    const refreshToken = this.tokenManager.signToken(
      {
        userId: user._id,
      },
      this.tokenManager.refreshTokenSignOptions
    );

    const accessToken = this.tokenManager.signToken({
      userId: user._id,
    });

    return { refreshToken, accessToken }
  }

  public async handleResendCode(email: string) {
    const user = await this.user.findOne({ email });

    if (!user) {
      throw new NotFoundException("Пользователь с таким адресом электронной почты не найден.");
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

  public async login(logInData: LogInDto) {

    const {email, password, rememberMe} = logInData

    const user = await this.user.findOne({ email: email });

    if (!user) {
      throw new NotFoundException("Пользователь с этим адресом электронной почты не найден.");
    }

    const isPasswordMatching = await compareValue(
      password,
      user.get("password", null, { getters: false })
    );

    if (!isPasswordMatching) {
      throw new NotFoundException("Неверный пароль. Пожалуйста, попробуйте снова.");
    }

    if (!user.isEmailConfirmed) {
      const verificationCode = await this.verificationCode.create({
        userId: user._id,
        type: VerificationCode.EmailVerification,
        expiresAt: oneYearFromNow(),
      });
      const url = `${process.env.APP_URL}/auth/email/verify/${verificationCode._id}?rememberMe=${rememberMe}`;

      await this.emailService.sendVerificationEmail(user.email, url);

      return {
        user,
        message: `Пользователь не подтвержден. Новое письмо для подтверждения отправлено на ${user.email}.`,
        status: 403
      };
    }

    const refreshToken = this.tokenManager.signToken(
      {
        userId: user._id,
      },
      rememberMe ? this.tokenManager.rememberRefreshTokenSignOptions : this.tokenManager.refreshTokenSignOptions
    );

    const accessToken = this.tokenManager.signToken({
      userId: user._id,
    });

    return { accessToken, refreshToken, user, message: "Успешный вход в систему!", status: 200};
  }

  public async loginWithGoogle(profile) {
    let user = await this.user.findOne({ googleId: profile.id });    
    if (!user) {
      user = await this.user.create({
        googleId: profile.id,
        username: profile._json?.given_name,
        email: profile._json?.email,
        isEmailConfirmed: profile._json?.email_verified,
        image: profile._json?.picture,
      });
    }
    return { user };
  }

  public async refreshUserAccesToken(refreshToken: string | undefined, rememberMe: boolean) {
    
    if (!refreshToken) {
      throw new NotFoundException("Токен обновления отсутствует.");
    }

    const { payload, error } = this.tokenManager.verifyToken<DataStoredInToken>(
      refreshToken,
      {
        secret: this.tokenManager.refreshTokenSignOptions.secret,
      }
    );

    if (error) {
      throw new NotFoundException("Неверный или истекший токен обновления.");
    }

    if (!payload) {
      throw new NotFoundException("Неверная нагрузка токена.");
    }

    const userId = payload.userId;
    const user = await this.user.findById(userId);
    if (!user) {
      throw new NotFoundException("Неверная нагрузка токена.");
    }

    const newAccessToken = this.tokenManager.signToken(
      { userId: user._id },
      this.tokenManager.accessTokenSignOptions
    );

    const newRefreshToken = this.tokenManager.signToken(
      { userId: user._id },
      refreshToken ? this.tokenManager.rememberRefreshTokenSignOptions : this.tokenManager.refreshTokenSignOptions
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
      throw new NotFoundException("Пользователь с этим адресом электронной почты не найден.");
    }

    const isPasswordMatching = await compareValue(
      oldPassword,
      user.get("password", null, { getters: false })
    );

    if (!isPasswordMatching) {
      throw new NotFoundException("Неверный старый пароль.");
    }

    if (password !== confirmPassword) {
      throw new NotFoundException("Пароли не совпадают.");
    }

    user.password = await hashValue(password);
    await user.save();
  }

  public async sendPasswordResetUrl(forgetPasswordData: ForgetPasswordDto) {
    const { email } = forgetPasswordData;

    const user = await this.user.findOne({ email });
    if (!user) {
      throw new NotFoundException("Пользователь с этим адресом электронной почты не найден.");
    }

    const recentRequest = await this.verificationCode.countDocuments({
      userId: user._id,
      type: VerificationCode.PasswordReset,
      createdAt: { $gt: fiveMinutesAgo() },
    });

    if (recentRequest >= 1) {
      throw new NotFoundException("Слишком много запросов, пожалуйста, попробуйте позже.");
    }

    const expiresAt = oneHourFromNow();
    const verificationCode = await this.verificationCode.create({
      userId: user._id,
      type: VerificationCode.PasswordReset,
      expiresAt,
    });

    const url = `${process.env.APP_FRONT_URL}/newForgetPassword?code=${
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
      throw new NotFoundException("Неверный или истекший код подтверждения.");
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
