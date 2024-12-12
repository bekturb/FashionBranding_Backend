import { Document } from "mongoose";
import Request from "./enum/request.enum";

export interface IRequest extends Document {
  name: string;
  phoneNumber: string;
  type: Request;
  seen: boolean,
  createdAt: Date;
}
