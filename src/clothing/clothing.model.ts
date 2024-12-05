import mongoose, { model, Schema } from 'mongoose';
import { IClothing } from './clothing.interface';

const clothingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: String,
    status: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    material: String,
    modelName: String,
    description: String,
    creatorId: {
      type: Object, //mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const clothingModel = model<IClothing & Document>('Clothing', clothingSchema);
