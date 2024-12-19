import { InternalServerErrorException } from "../exceptions/internalServerError.exception";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST as string,
      port: parseInt(process.env.SMTP_PORT as string, 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER as string,
        pass: process.env.SMTP_PASSWORD as string,
      },
    });
  }

  public async sendVerificationEmail(
    email: string,
    verificationLink: string
  ): Promise<void> {
    try {
      const emailContent = this.getVerificationEmailContent(verificationLink);

      await this.transporter.sendMail({
        from: '"Your App Name" <no-reply@yourapp.com>',
        to: email,
        subject: "Email Verification",
        html: emailContent,
      });

    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send verification email to ${email}. Please try again.`
      );
    }
  }

  public async sendVerificationOtp(
    email: string,
    otpCode: string
  ): Promise<void> {
    try {
      const emailContent = this.getVerificationOtpContent(otpCode);

      await this.transporter.sendMail({
        from: '"Your App Name" <no-reply@yourapp.com>',
        to: email,
        subject: "Email Verification Otp Code",
        html: emailContent,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send verification email to ${email}. Please try again.`
      );
    }
  }

  public async sendResetPassworUrl(
    email: string,
    verificationLink: string
  ): Promise<void> {
    try {
      const emailContent = this.getResetPasswordContent(verificationLink);

      await this.transporter.sendMail({
        from: '"Your App Name" <no-reply@yourapp.com>',
        to: email,
        subject: "Email Verification Otp Code",
        html: emailContent,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send verification email to ${email}. Please try again.`
      );
    }
  }

  private getVerificationEmailContent(verificationLink: string): string {
    return `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #007bff;">Welcome to Our App!</h2>
            <p>Please verify your email by clicking the button below:</p>
            <a href="${verificationLink}" style="
              display: inline-block; 
              padding: 10px 20px; 
              color: #fff; 
              background-color: #007bff; 
              text-decoration: none; 
              border-radius: 5px;
            ">Verify Email</a>
            <p style="margin-top: 20px;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a></p>
            <p>Thank you for joining us!</p>
          </div>
        `;
  }

  private getResetPasswordContent(verificationLink: string): string {
    return `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #007bff;">Welcome to Our App!</h2>
            <p>Please reset your password by clicking the button below:</p>
            <a href="${verificationLink}" style="
              display: inline-block; 
              padding: 10px 20px; 
              color: #fff; 
              background-color: #007bff; 
              text-decoration: none; 
              border-radius: 5px;
            ">Verify Email</a>
            <p style="margin-top: 20px;">If the button above doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a></p>
            <p>Thank you for joining us!</p>
          </div>
        `;
  }

  private getVerificationOtpContent(otpCode: string): string {
    return `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #007bff;">Welcome to Our App!</h2>
            <p>Please verify your email by the otp code below:</p>
              <div>${otpCode}</div>
            <p>Thank you for joining us!</p>
          </div>
        `;
  }
}

export default EmailService;
