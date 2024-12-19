import { model, Schema } from "mongoose";
import { IRequest } from "./request.interface";

const RequestSchema = new Schema<IRequest>({
  name: {
    type: String,
    required: true,
  },

  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },

  type: {
    type: String,
    required: true,
  },

  seen: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

export const requestModel = model<IRequest>(
  "RequestCode",
  RequestSchema,
  "request_codes"
);
