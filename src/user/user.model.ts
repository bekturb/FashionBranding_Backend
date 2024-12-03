import { Document, model, Schema } from 'mongoose';
import { IUser } from './user.interface';

const userSchema = new Schema(
  {
    username: String,
    email: String,
    password: {
      type: String,
      get: (): undefined => undefined,
    },
    role: String,
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  },
);

export const userModel = model<IUser & Document>('User', userSchema);
