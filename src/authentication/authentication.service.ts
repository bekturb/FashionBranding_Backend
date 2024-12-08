import UserWithThatEmailAlreadyExistsException from "../exceptions/UserWithThatEmailAlreadyExistsException";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "../user/user.dto";
import { userModel } from "../user/user.model";
import EmailService from "./email.service";
import { verificationCodeModel } from "./verification.model";
import { oneYearFromNow } from "../utils/date";
import VerificationCode from "./enum/verificationCode.enum";

class AuthenticationService {
  public user = userModel;
  public verificationCode = verificationCodeModel;
  private emailService = new EmailService();
  public 

  public async register(userData: CreateUserDto) {
    if (await this.user.findOne({ email: userData.email })) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.user.create({
      ...userData,
      password: hashedPassword,
    });

    const verificationCode = await this.verificationCode.create({
      userId: user._id,
      type: VerificationCode.EmailVerification,
      expiresAt: oneYearFromNow(),
    });

    const url = `${process.env.APP_URL}auth/email/verify/${verificationCode._id}`;

    await this.emailService.sendVerificationEmail(user.email, url);
    return {
      user,
    };
  }
}

export default AuthenticationService;