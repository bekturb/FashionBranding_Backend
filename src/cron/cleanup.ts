import { visitorModel } from "../visitor/visitor.model";
import { connectToMongo } from "../lib/db";
import * as cron from "node-cron";
import { getTimeTwoMonthAgo } from "../utils/date";

connectToMongo();

cron.schedule("0 0 * * *", async () => {
  try {
    const twoMonthsAgo = getTimeTwoMonthAgo();
    
    await visitorModel.deleteMany({
      updatedAt: { $lt: twoMonthsAgo },
    });

  } catch (error) {
    console.error("Ошибка во время очистки:", error);
  }
});
