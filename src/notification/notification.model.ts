import { Document, model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema({
  owner: {
    type: String,
    required: true,
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

export const notificationModel = model<INotification & Document>(
  "NotificationCode",
  notificationSchema,
  "notification_code"
);
