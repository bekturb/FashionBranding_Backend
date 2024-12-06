import { model, Schema } from "mongoose";
import { IOtpCode, IVerificationCode } from "./verifications.interface";

const verificationCodeSchema = new Schema<IVerificationCode>({
  userId: {
    ref: "User",
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  type: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const verificationCodeModel = model<IVerificationCode>(
  "VerificationCode",
  verificationCodeSchema,
  "verification_codes"
);

const otpCodeSchema = new Schema<IOtpCode>({
  email: {
    type: String,
    required: true,
    unique: true
  },
  otp: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
});

otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const otpCodeModel = model<IOtpCode>(
  "OtpCode",
  otpCodeSchema,
  "otp_codes"
);

export { verificationCodeModel, otpCodeModel };
