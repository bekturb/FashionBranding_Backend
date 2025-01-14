import { model, Schema } from 'mongoose';
import { IBanner } from './banner.inteface';

const bannerSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  leftImages: {
    type: Array,
  },
  
  rightImage: {
    type: String
  },
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