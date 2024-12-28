import { Document, model, Schema } from "mongoose";
import { INewsletter } from "./newsletter.interface";

const newsletterSchema = new Schema({
  email: {
    type: String,
    unique: true,
  },
});

export const newsletterModel = model<INewsletter & Document>("Newsletter", newsletterSchema);