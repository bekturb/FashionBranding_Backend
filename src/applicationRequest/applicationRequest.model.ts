import { Document, model, Schema } from 'mongoose';
import { IApplicationRequest } from './applicationRequest.interface';

const applicationRequestSchema = new Schema(
  {
    name: String,
    size: String,
    textileName: String,
    phoneNumber: String,
    image: String,
    seen: {
      type: String,
      default: false
    },
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
    timestamps: true,
  },
);

export const applicationRequestModel = model<IApplicationRequest & Document>(
  'ApplicationRequest',
  applicationRequestSchema,
);
