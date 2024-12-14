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
    password: {
      type: String,
      get: (): undefined => undefined,
    },
    image: {
      type: String,
    },
    isEmailConfirmed: Boolean,
    position: {
      type: String,
      default: "Employee",
    },
    role: {
      type: String,
      default: "Guest",
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
