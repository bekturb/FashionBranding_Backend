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

    const existingVisitor = await this.visitor.findOne({ userAgent, page });
    if (existingVisitor) {
      existingVisitor.visitHistory.push(currentTimestamp);
      await existingVisitor.save();
      return {
        statusCode: 200,
        response: {
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

    let percentageChange = 0;
    if (lastWeekCount > 0) {
      percentageChange =
        ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100;
    } else if (thisWeekCount > 0) {
      percentageChange = 100;
    }

    return {
      data: {
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
        percentage: percentageChange,
      },
    };
  }

  public async getChartVisitorsByWeek() {
    const visitorData = await this.visitor.find();

    const { thisWeek } = getWeekRange()
    const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

    const visitors = weekDays.map((day) => ({
      name: day,
      pv: 0,
      amt: 0,
      uv: 0,
    }));

    visitorData.forEach((visitor) => {
      const uniqueIps = new Set();

      visitor.visitHistory.forEach((visit) => {
        const visitDate = new Date(visit);

        if (visitDate >= thisWeek.start && visitDate <= thisWeek.end) {
          const dayIndex = visitDate.getUTCDay();
          const targetDay = visitors[dayIndex];

          targetDay.pv += 1;
          targetDay.amt += 5;

          if (!uniqueIps.has(visitor.ip)) {
            uniqueIps.add(visitor.ip);
            targetDay.uv += 1;
          }
        }
      });
    });
    return { visitors };
  }
}

export default VisitorService;
