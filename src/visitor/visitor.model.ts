import { model, Schema } from "mongoose";
import { IVisitor } from "./visitor.interface";

const visitorSchema = new Schema<IVisitor>({
  ip: {
    type: String,
    required: true,
  },

  userAgent: {
    type: String,
    required: true,
  },

  page: {
    type: String,
    default: "/",
  },

  visitHistory: [
    {
      type: Date,
    },
  ],
},
{
    timestamps: true
});

export const visitorModel = model<IVisitor & Document>(
  "VisitorCodes",
  visitorSchema,
);
