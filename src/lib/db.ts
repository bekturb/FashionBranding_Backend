import mongoose, { ConnectOptions } from "mongoose";

const options: ConnectOptions = {
  maxPoolSize: 10
};

export const connectToMongo = () => {
  
  const { MONGO_PATH } = process.env;
  mongoose.set("strictQuery", false);
  mongoose.connect(MONGO_PATH as string, options);
};
