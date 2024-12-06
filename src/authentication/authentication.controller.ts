import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Request, Response, NextFunction, Router } from 'express';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import { IController } from '../interfaces/controller.interface';
import DataStoredInToken from '../interfaces/dataStoredInToken';
import TokenData from '../interfaces/tokenData.interface';
import {validationMiddleware} from '../middleware/validation.middleware';
import { CreateUserDto } from '../user/user.dto';
import { IUser } from '../user/user.interface';
import { userModel } from '../user/user.model';
import AuthenticationService from './authentication.service';
import { LogInDto } from './login.dto';
import { NotFoundException } from '../exceptions/notfound.exception';
import { otpCodeModel, verificationCodeModel } from './verification.model';
import VerificationCodeType from './enum/verificationCode.enum';
import { UserNotFoundException } from '../exceptions/userNotFound.exception';
import VerificationsService from './verifications.service';
import EmailService from './email.service';

export class AuthenticationController implements IController {
  public path = '/auth';
  public router = Router();
  public authenticationService = new AuthenticationService();
  public verificationService = new VerificationsService();
  private user = userModel;
  private verificationCode = verificationCodeModel;
  private otp = otpCodeModel;
  private emailService = new EmailService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), this.registration);
    this.router.get(`${this.path}/email/verify/:verificationId`, this.firstStepVerify);
    this.router.post(`${this.path}/email/verify`, this.secondStepVerify);
    // this.router.post(`${this.path}/login`, validationMiddleware(LogInDto), this.loggingIn);
    this.router.post(`${this.path}/logout`, this.loggingOut);
  }

  private registration = async (request: Request, response: Response, next: NextFunction) => {
    const userData: CreateUserDto = request.body;
    try {
      const {
        user,
      } = await this.authenticationService.register(userData);
      response.send(user);
    } catch (error) {
      next(error);
    }
  }

  private firstStepVerify = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { verificationId } = request.params;

      if (!mongoose.Types.ObjectId.isValid(verificationId)) {
        return next(new NotFoundException('Invalid Id'));
      }

      const validCode = await this.verificationCode.findOne({
        _id: verificationId,
        type: VerificationCodeType.EmailVerification,
        expiresAt: { $gt: new Date() },
      });

      if (!validCode) {
        return next(new NotFoundException('Invalid or expired verification code'));
      }

      const user = await this.user.findById(validCode.userId);
      if (!user) {
        return next(new UserNotFoundException(String(validCode.userId)));
      }

      const otp = await this.verificationService.generateOtpCode(user);
      await this.emailService.sendVerificationOtp(user.email, otp);

      response.status(200).send({
        message: `Verification OTP code sent to ${user.email}`,
      });
    } catch (error) {
      next(error);
    }

  }

  public secondStepVerify = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { email, otpCode }: { email: string; otpCode: string } = request.body;

      const user = await this.user.findOne({ email });
      if (!user) {
        return next(new NotFoundException('User not found with this email'));
      }

      const storedOtp = await this.otp.findOne({ email });
      if (!storedOtp || new Date() > storedOtp.expiresAt) {
        return next(new NotFoundException('Invalid or expired OTP code'));
      }

      const isValidOtp = bcrypt.compareSync(otpCode, storedOtp.otp);
      if (!isValidOtp) {
        return next(new NotFoundException('Invalid OTP'));
      }

      const accessToken = this.createAccessToken(user);
      const refreshToken = this.createRefreshToken(user);

      response.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      await this.otp.deleteOne({ email });

      response.status(200).send({ accessToken, refreshToken });
    } catch (error) {
      next(error);
    }
  };

  // private loggingIn = async (request: Request, response: Response, next: NextFunction) => {
  //   const logInData: LogInDto = request.body;
  //   const user = await this.user.findOne({ email: logInData.email });
  //   if (user) {
  //     const isPasswordMatching = await bcrypt.compare(
  //       logInData.password,
  //       user.get('password', null, { getters: false }),
  //     );
  //     if (isPasswordMatching) {
  //       const tokenData = this.createToken(user);
  //       response.setHeader('Set-Cookie', [this.createCookie(tokenData)]);
  //       response.send(user);
  //     } else {
  //       next(new WrongCredentialsException());
  //     }
  //   } else {
  //     next(new WrongCredentialsException());
  //   }
  // }

  private loggingOut = (request: Request, response: Response) => {
    response.setHeader('Set-Cookie', ['Authorization=;Max-age=0']);
    response.send(200);
  }

  private createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
  }

  public createAccessToken(user: IUser): TokenData {
    const expiresIn = 60 * 15;
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      _id: user._id,
    };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }

  public createRefreshToken(user: IUser): TokenData {
    const expiresIn = 60 * 60 * 24 * 7;
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      _id: user._id,
    };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }
}