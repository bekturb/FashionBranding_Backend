import mongoose from "mongoose";

export const connectToMongo = () => {
  const { MONGO_PATH } = process.env;
  mongoose.set("strictQuery", false);
  mongoose.connect(MONGO_PATH as string);
};
