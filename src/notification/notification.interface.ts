import { Document } from "mongoose";
import Request from "../request/enum/request.enum";

export interface INotification extends Document {
  name: string;
  type: Request;
  seen: boolean;
}
