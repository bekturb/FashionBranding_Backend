import { verificationCodeModel } from "./verification.model";
import VerificationCodeType from "./enum/verificationCode.enum";
import { oneYearFromNow } from "../utils/date";
import { IUser } from "user/user.interface";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { otpCodeModel } from "../authentication/verification.model";

class VerificationsService {
  public verificationCode = verificationCodeModel;
  private OTP_EXPIRATION_TIME = 5 * 60 * 1000;

  public async createVerificationCode(user: IUser) {
    const verificationCode = await verificationCodeModel.create({
      userId: user._id,
      type: VerificationCodeType.EmailVerification,
      expiresAt: oneYearFromNow(),
    });

    return verificationCode;
  }

  public async generateOtpCode(user: IUser) {
    const otp = crypto.randomInt(1000, 9999).toString();
    const hashedOtp = bcrypt.hashSync(otp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRATION_TIME);

    await otpCodeModel.create({
      email: user.email,
      otp: hashedOtp,
      expiresAt,
    });
    return otp;
  }
}

export default VerificationsService;
