import { getWeekRange } from "../utils/date";
import { visitorModel } from "./visitor.model";

class VisitorService {
  private visitor = visitorModel;
  public;

  public async createVisitor(
    ip: string | string[],
    userAgent: string,
    page: string
  ) {
    const currentTimestamp = new Date();

    const existingVisitor = await this.visitor.findOne({ ip, page });
    if (existingVisitor) {
      existingVisitor.visitHistory.push(currentTimestamp);
      await existingVisitor.save();
      return {
        statusCode: 200,
        response: {
          message: "Visitor updated successfully",
          visitor: existingVisitor,
        },
      };
    }

    const newVisitor = new this.visitor({
      ip,
      userAgent,
      page,
      visitHistory: [currentTimestamp],
    });
    await newVisitor.save();

    return {
      statusCode: 201,
      response: {
        message: "Visitor tracked successfully",
        visitor: newVisitor,
      },
    };
  }

  public async getWeeksVisitors() {
    const { thisWeek, previousWeek } = getWeekRange();

    const visitors = await this.visitor.find();
    let thisWeekCount = 0;
    let lastWeekCount = 0;

    visitors.forEach((visitor) => {
      const visitsThisWeek = visitor.visitHistory.filter(
        (visit) => visit >= thisWeek.start && visit < thisWeek.end
      );
      const visitsLastWeek = visitor.visitHistory.filter(
        (visit) => visit >= previousWeek.start && visit < previousWeek.end
      );

      if (visitsThisWeek.length > 0) thisWeekCount++;
      if (visitsLastWeek.length > 0) lastWeekCount++;
    });

    return {
      data: {
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
      },
    };
  }
}

export default VisitorService;
