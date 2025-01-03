import { IUser } from "user/user.interface";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { otpCodeModel } from "../authentication/verification.model";

class VerificationsService {
  private OTP_EXPIRATION_TIME = 5 * 60 * 1000;

  public async generateOtpCode(user: IUser): Promise<string> {
    const otp = crypto.randomInt(1000, 9999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRATION_TIME);

    await otpCodeModel.findOneAndUpdate(
      { email: user.email },
      { 
        otp: hashedOtp, 
        expiresAt, 
        email: user.email
      }, 
      { upsert: true, new: true }
    );

    return otp;
  }
}

export default VerificationsService;
