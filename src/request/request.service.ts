import mongoose, { ClientSession } from "mongoose";
import { requestModel } from "./request.model";
import { notificationModel } from "../notification/notification.model";
import { CreateRequestDto } from "./request.dto";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import { QueryBuilder } from "../utils/queryBuilder";
import { PipelineStage } from "mongoose";
import { getWeekRange } from "../utils/date";
import { ApplicationRequestNotFoundException } from "../exceptions/applicationRequestNotFound.exception";

class RequestService {
  public request = requestModel;
  public notification = notificationModel;
  public mongoose = mongoose;
  public;

  public async addRequest(requestData: CreateRequestDto) {
    const session: ClientSession = await this.mongoose.startSession();
    session.startTransaction();

    try {
      const request = new this.request(requestData);
      const notification = new this.notification({
        owner: requestData.name,
        type: requestData.type,
      });

      await request.save({ session });
      await notification.save({ session });

      await session.commitTransaction();
      return { request };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  public async getRequests(requestQueries: IRequestsQuery) {
    const queryBuilder = new QueryBuilder(requestQueries);

    const skip = queryBuilder.getSkip();
    const limit = queryBuilder.getLimit();
    const filters = queryBuilder.getFilters();
    const page = queryBuilder.getPage();

    const [requests, total] = await Promise.all([
      this.request.find(filters).skip(skip).limit(limit),
      this.request.countDocuments(),
    ]);

    return { requests, total, page, limit };
  }

  public async hanldeChartRequests() {
    const currentDate = new Date();
    const last9Months = [];

    for (let i = 8; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      last9Months.push(date.toISOString().slice(0, 7));
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(currentDate.getMonth() - 9)),
          },
        },
      },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        },
      },
      {
        $group: {
          _id: "$month",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const result = await this.request.aggregate(pipeline);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const data = last9Months.map((month) => {
      const monthData = result.find((entry) => entry._id === month);
      const monthIndex = parseInt(month.slice(5, 7), 10) - 1;
      return {
        name: monthNames[monthIndex],
        pv: monthData ? monthData.count * 10 : 0,
        amt: monthData ? monthData.count : 0,
        uv: monthData ? monthData.count : 0,
      };
    });

    return { data };
  }

  public async handleWeekRequests() {
    const { thisWeek, previousWeek } = getWeekRange();

    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: previousWeek.start,
            $lte: thisWeek.end,
          },
        },
      },
      {
        $project: {
          week: {
            $cond: [
              { $gte: ["$createdAt", thisWeek.start] },
              "thisWeek",
              "lastWeek",
            ],
          },
        },
      },
      {
        $group: {
          _id: "$week",
          count: { $sum: 1 },
        },
      },
    ];

    const result = await this.request.aggregate(pipeline);

    const thisWeekData =
      result.find((entry) => entry._id === "thisWeek")?.count || 0;
    const lastWeekData =
      result.find((entry) => entry._id === "lastWeek")?.count || 0;

    let percentageChange = 0;
    if (lastWeekData > 0) {
      percentageChange = ((thisWeekData - lastWeekData) / lastWeekData) * 100;
    } else if (thisWeekData > 0) {
      percentageChange = 100;
    }

    return { thisWeekData, lastWeekData, percentageChange };
  }

  public async getRequest(id: string) {
    const request = await this.request.findById(id);

    if (!request) {
      throw new ApplicationRequestNotFoundException(id);
    }
    return { request };
  }

  public async removeRequest(id: string) {
    const request = await this.request.findByIdAndDelete(id);

    if (!request) {
      throw new ApplicationRequestNotFoundException(id);
    }

    return { request };
  }

  public async updateRequestSeenStatus(id: string) {
    const request = await this.request.findByIdAndUpdate(
      id,
      {
        seen: true,
      },
      { new: true }
    );

    if (!request) {
      throw new ApplicationRequestNotFoundException(id);
    }

    return { request };
  }
}

export default RequestService;
