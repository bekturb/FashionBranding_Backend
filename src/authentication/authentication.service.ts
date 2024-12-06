import UserWithThatEmailAlreadyExistsException from "../exceptions/UserWithThatEmailAlreadyExistsException";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { CreateUserDto } from "../user/user.dto";
import TokenData from "../interfaces/tokenData.interface";
import DataStoredInToken from "../interfaces/dataStoredInToken";
import { IUser } from "../user/user.interface";
import VerificationCodeService from "./verifications.service";
import { userModel } from "../user/user.model";
import EmailService from "./email.service";

class AuthenticationService {
  public user = userModel;
  private verificationCodeService = new VerificationCodeService()
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

    const verificationCode = await this.verificationCodeService.createVerificationCode(user)

    const url = `${process.env.APP_URL}auth/email/verify/${verificationCode._id}`;

    await this.emailService.sendVerificationEmail(user.email, url);
    return {
      user,
    };
  }
}

export default AuthenticationService;