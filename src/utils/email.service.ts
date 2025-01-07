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
        subject: "Подтверждение электронной почты",
        html: emailContent,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Не удалось отправить письмо для подтверждения на ${email}. Пожалуйста, попробуйте снова.`
      );
    }
  }

  public async sendNewsletter(
    emailList: string[],
    name: string
  ): Promise<void> {
    const emailContent = this.getNewsletterContent(name);

    await this.transporter.sendMail({
      from: '"Your App Name" <no-reply@yourapp.com>',
      to: emailList.join(","),
      subject: "Доступен новый товар одежды!",
      html: emailContent,
    });
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
        subject: "Код OTP для подтверждения электронной почты",
        html: emailContent,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Не удалось отправить письмо для подтверждения на ${email}. Пожалуйста, попробуйте снова.`
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
        subject: "Код OTP для подтверждения электронной почты.",
        html: emailContent,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Не удалось отправить письмо для подтверждения на ${email}. Пожалуйста, попробуйте снова.`
      );
    }
  }

  private getVerificationEmailContent(verificationLink: string): string {
    return `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #007bff;">Добро пожаловать в наше приложение Fashion-Branding!</h2>
            <p>Пожалуйста, подтвердите ваш адрес электронной почты, кликнув по кнопке ниже:</p>
            <a href="${verificationLink}" style="
              display: inline-block; 
              padding: 10px 20px; 
              color: #fff; 
              background-color: #007bff; 
              text-decoration: none; 
              border-radius: 5px;
            ">Подтвердить электронную почту</a>
            <p style="margin-top: 20px;">Если кнопка выше не работает, скопируйте и вставьте эту ссылку в адресную строку вашего браузера:</p>
            <p><a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a></p>
            <p>Спасибо, что присоединились к нам!</p>
          </div>
        `;
  }

  private getNewsletterContent(name: string): string {
    return `
         <p>Посмотрите наш новый товар одежды: <strong>${name}</strong></p>
        `;
  }

  private getResetPasswordContent(verificationLink: string): string {
    return `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #007bff;">Добро пожаловать в наше приложение Fashion-Branding!</h2>
            <p>Пожалуйста, сбросьте ваш пароль, кликнув по кнопке ниже:</p>
            <a href="${verificationLink}" style="
              display: inline-block; 
              padding: 10px 20px; 
              color: #fff; 
              background-color: #007bff; 
              text-decoration: none; 
              border-radius: 5px;
            ">Подтвердить электронную почту</a>
            <p style="margin-top: 20px;">Если кнопка выше не работает, скопируйте и вставьте эту ссылку в адресную строку вашего браузера:</p>
            <p><a href="${verificationLink}" style="color: #007bff;">${verificationLink}</a></p>
            <p>Спасибо, что присоединились к нам!</p>
          </div>
        `;
  }

  private getVerificationOtpContent(otpCode: string): string {
    return `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #007bff;">Добро пожаловать в наше приложение Fashion-Branding!</h2>
            <p>Please verify your email by the otp code below:</p>
              <div>${otpCode}</div>
            <p>Спасибо, что присоединились к нам!</p>
          </div>
        `;
  }
}

export default EmailService;
