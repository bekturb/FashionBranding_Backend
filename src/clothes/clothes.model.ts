import { model, Schema } from 'mongoose';
import { IClothes } from './clothes.interface';

const clothesSchema = new Schema(
  {
    clothesName: {
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
  },
  {
    timestamps: true,
  },
);

export const clothesModel = model<IClothes & Document>('Clothes', clothesSchema);
