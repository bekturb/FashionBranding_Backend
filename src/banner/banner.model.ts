import { model, Schema } from 'mongoose';
import { IBanner } from './banner.interface';

const bannerSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: String,
  btnColor: {
    type: String,
    required: true,
  },
  btnText: {
    type: String,
    required: true,
  },
});

export const bannerModel = model<IBanner & Document>('Banner', bannerSchema);
