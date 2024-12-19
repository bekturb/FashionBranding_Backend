import mongoose from "mongoose";
import VerificationCodeType from "./enum/verificationCode.enum";

export interface IVerificationCode extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    type: VerificationCodeType;
    expiresAt: Date;
    createdAt: Date;
  }

  export interface IOtpCode extends mongoose.Document {
    email: string;
    otp: string;
    expiresAt: Date;
    createdAt: Date;
  }