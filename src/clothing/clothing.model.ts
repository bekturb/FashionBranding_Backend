import mongoose, { model, Schema } from 'mongoose';
import { IClothing } from './clothing.interface';

const clothingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    material: String,
    description: String,
    creatorId: {
      type: Object,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const clothingModel = model<IClothing & Document>('Clothing', clothingSchema);
