import { Document, model, Schema } from 'mongoose';
import { IApplicationRequest } from './applicationRequest.interface';

const applicationRequestSchema = new Schema(
  {
    name: String,
    size: String,
    textileName: String,
    phoneNumber: String,
  },
  {
    toJSON: {
      virtuals: true,
      getters: true,
    },
  },
);

export const applicationRequestModel = model<IApplicationRequest & Document>(
  'ApplicationRequest',
  applicationRequestSchema,
);
