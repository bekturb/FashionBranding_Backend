import { Document, model, Schema } from "mongoose";
import { IUser } from "./user.interface";

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    googleId: {
      type: String,
    },
    password: {
      type: String,
      get: (): undefined => undefined,
    },
    image: {
      type: String,
    },
    
    isEmailConfirmed: Boolean,
    role: {
      type: String,
      default: "Admin",
    },
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
    timestamps: true,
  }
);

export const userModel = model<IUser & Document>("User", userSchema);
