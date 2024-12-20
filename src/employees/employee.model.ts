import { Document, model, Schema } from "mongoose";
import { IEmployee } from "./employee.interface";

const employeeSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
    },
    position: {
        type: String,
      },
  },
  {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
  }
);

export const employeeModel = model<IEmployee & Document>("Employee", employeeSchema);