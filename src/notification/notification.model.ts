import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>({
  name: {
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
  }
});

export const notificationModel = model<INotification>(
  "NoticationsCode",
  notificationSchema,
  "notification_codes"
);
