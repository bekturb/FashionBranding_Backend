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
import DataStoredInToken from "../interfaces/dataStoredInToken";
import { authMiddleware } from "../middleware/auth";

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
    this.router.post(
      `${this.path}/resend/verification-code/:email`,
      this.resendVerificationCode
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

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register a new user
   *     tags:
   *       - Authentication
   *     description: Register a new user by providing their username, email, and password. A confirmation message or email will be sent to the provided email address.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *                 example: Bektursun
   *                 description: The username of the new user.
   *               email:
   *                 type: string
   *                 example: bekkgboy2@gmail.com
   *                 description: The email address of the new user.
   *               password:
   *                 type: string
   *                 example: securepassword123
   *                 description: The password for the new user.
   *     responses:
   *       201:
   *         description: User registered successfully. A confirmation message has been sent to the user's email.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Registration successful. A confirmation email has been sent to bekkgboy2@gmail.com."
   *       400:
   *         description: Invalid input or missing parameters.
   *       409:
   *         description: Email is already in use.
   */

  private registration = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const userData: CreateUserDto = request.body;
    try {
      const { user } = await this.authenticationService.register(userData);
      response.status(201).send({user, message: "Sent verification link to your email"});
    } catch (error) {
      next(error);
    }
  };

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the profile of the authenticated user based on the provided token.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: [] # Updated to use a common security scheme name like "bearerAuth"
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: "Bearer token for authentication. Example: `Bearer <your_token>`"
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "12345"
 *                 username:
 *                   type: string
 *                   example: "john_doe"
 *                 email:
 *                   type: string
 *                   example: "john@example.com"
 *                 isConfirmed:
 *                   type: boolean
 *                   example: true
 *                 image:
 *                   type: string
 *                   example: "jdjdjd.jpeg"
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Internal Server Error
 */


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

  /**
   * @swagger
   * /auth/email/verify/{verificationId}:
   *   get:
   *     summary: Send otp code to user's email
   *     tags:
   *       - Authentication
   *     description: Find a user by verificationId. A Otpcode message will be sent to the provided email address.
   *     responses:
   *       201:
   *         description: Verification OTP code sent to your email.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Verification OTP code sent to your email bekkgboy2@gmail.com."
   *       400:
   *         description: Invalid or expired verification code.
   *       404:
   *         description: User not found.
   */

  private firstStepVerify = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const { verificationId } = request.params;
    try {
      const result = await this.authenticationService.firstStepVerification(
        verificationId,
      );

      if (result.redirect) {
        return response.redirect(result.redirect);
      }

      const { user } = result;
      
      response.redirect(`${process.env.APP_FRONT_URL}/stepVerification?email=${encodeURIComponent(user.email)}`);
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
      const { user } = await this.authenticationService.handleResendCode(email, next)
      response.status(201).send({user, message: "Sent verification link to your email"});
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /auth/email/verify:
   *   post:
   *     summary: Verify email using OTP code
   *     tags:
   *       - Authentication
   *     description: Verify a new user's email by providing their email and OTP code. If successful, the endpoint returns the user details and an access token.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 example: bekkgboy2@gmail.com
   *                 description: The email address of the new user.
   *               otpCode:
   *                 type: string
   *                 example: 1223
   *                 description: The OTP code sent to the user's email.
   *     responses:
   *       200:
   *         description: User verified successfully. Returns user data and access token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: 64b2f0c7e11a4e6d8b16a8e2
   *                       description: The unique ID of the user.
   *                     username:
   *                       type: string
   *                       example: Bektursun
   *                       description: The name of the user.
   *                     email:
   *                       type: string
   *                       example: bekkgboy2@gmail.com
   *                       description: The email address of the user.
   *                     isConfirmed:
   *                       type: boolean
   *                       example: true
   *                       description: The confirmation of the user.
   *                 refreshToken:
   *                   type: string
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                   description: The JWT access token.
   *       400:
   *         description: Invalid input or missing parameters.
   *       404:
   *         description: Invalid or expired OTP code.
   */

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
        refreshToken,
      });

      response.status(200).send({ accessToken, user });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: User login
   *     tags:
   *       - Authentication
   *     description: Authenticate a user by their email and password. Returns user data and a JWT access token.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 example: bekkgboy2@gmail.com
   *                 description: The email address of the user.
   *               password:
   *                 type: string
   *                 example: mypassword123
   *                 description: The password of the user.
   *     responses:
   *       200:
   *         description: Login successful. Returns user data and access token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: 64b2f0c7e11a4e6d8b16a8e2
   *                       description: The unique ID of the user.
   *                     username:
   *                       type: string
   *                       example: Bektursun
   *                       description: The name of the user.
   *                     email:
   *                       type: string
   *                       example: bekkgboy2@gmail.com
   *                       description: The email address of the user.
   *                 refreshToken:
   *                   type: string
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                   description: The JWT access token.
   *       400:
   *         description: Invalid input or missing parameters.
   *       404:
   *         description: Incorrect email or password.
   *       401:
   *         description: Wrong credentials provided.
   *       403:
   *         description: User is not verified. A new verification email has been sent to ${user.email}..
   */

  private loggingIn = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    const logInData: LogInDto = request.body;

    try {
      const { accessToken, refreshToken, user } =
        await this.authenticationService.login(logInData, response, next);

      this.cookiesManager.setAuthCookies({
        response,
        refreshToken,
      });

      response.status(200).send({ accessToken, user });
    } catch (error) {
      next(error);
    }
  };

  /**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the user
 *     tags:
 *       - Authentication
 *     description: Clears authentication cookies and logs the user out.
 *     responses:
 *       200:
 *         description: Logout successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *                   description: Confirmation message for successful logout.
 *       500:
 *         description: An internal server error occurred.
 */

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

      const { newAccessToken, newRefreshToken } =
        await this.authenticationService.refreshUserAccesToken(
          refreshToken,
          next
        );

      this.cookiesManager.setAuthCookies({
        response,
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

  /**
 * @swagger
 * /auth/password/reset:
 *   post:
 *     summary: Reset user password
 *     tags:
 *       - Authentication
 *     description: Reset a user's password by providing their email, old password, new password, and confirmation password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: bekkgboy2@gmail.com
 *                 description: The email address of the user requesting a password reset.
 *               oldPassword:
 *                 type: string
 *                 example: oldpassword123
 *                 description: The user's current password.
 *               password:
 *                 type: string
 *                 example: newpassword123
 *                 description: The new password to set.
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
 *                 description: The confirmation of the new password.
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *                   description: Confirmation message for the successful password reset.
 *       400:
 *         description: Invalid input or validation errors (e.g., mismatched passwords).
 *       404:
 *         description: User not found or incorrect old password.
 *       500:
 *         description: An internal server error occurred.
 */


  private resetPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const resetPasswordData: ResetPasswordDto = request.body;

      await this.authenticationService.resetUserPassword(
        resetPasswordData,
        next
      );

      response.status(200).send({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };

  /**
 * @swagger
 * /auth/forget/password:
 *   post:
 *     summary: Send password reset email
 *     tags:
 *       - Authentication
 *     description: Sends a password reset email to the user with a reset URL.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *                 description: The email address of the user.
 *     responses:
 *       200:
 *         description: Password reset email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A password reset email has been sent to user@example.com.
 *       400:
 *         description: Invalid input or missing parameters.
 *       404:
 *         description: User not found with the provided email.
 *       429:
 *         description: Too many requests, please try again later.
 */


  private sendPasswordReset = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const forgetPasswordData: ForgetPasswordDto = request.body;

      const { user } = await this.authenticationService.sendPasswordResetUrl(
        forgetPasswordData,
        next
      );

      response.status(200).send({
        message: `A password reset email has been sent to ${user.email}.`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset forgotten password
 *     tags:
 *       - Authentication
 *     description: Allows users to reset their forgotten password by providing a valid verification code and a new password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationCode:
 *                 type: string
 *                 example: 64b2f0c7e11a4e6d8b16a8e2
 *                 description: The unique verification code for resetting the password.
 *               password:
 *                 type: string
 *                 example: NewPassword123!
 *                 description: The new password for the user.
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully.
 *       400:
 *         description: Invalid input or missing parameters.
 *       404:
 *         description: Invalid or expired verification code, or user not found.
 */

  private resetForgotenPassword = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const resetForgotenPasswordData: ResetForgotenPasswordDto = request.body;

      await this.authenticationService.resetForgetPassword(
        resetForgotenPasswordData,
        next
      );
      this.cookiesManager.clearAuthCookies(response);

      response.status(200).send({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  };
}
