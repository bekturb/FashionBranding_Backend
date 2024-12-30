import mongoose, { ClientSession } from "mongoose";
import { ApplicationRequestNotFoundException } from "../exceptions/applicationRequestNotFound.exception";
import { applicationRequestModel } from "./applicationRequest.model";
import { QueryBuilder } from "../utils/queryBuilder";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import { IApplicationRequest } from "./applicationRequest.interface";
import { notificationModel } from "../notification/notification.model";
import NotificationEnum from "../notification/enum/notification.enum";

class ApplicationRequestService {
  public applicationRequest = applicationRequestModel;
  private notification = notificationModel;
  private mongoose = mongoose;
  public;

  public async getApplicationRequest(id: string) {
    const applicationRequest = await this.applicationRequest.findById(id);
    if (!applicationRequest) {
      throw new ApplicationRequestNotFoundException(id);
    }
    return { applicationRequest };
  }

  public async getApplicationRequests(requestQueries: IRequestsQuery) {
    const queryBuilder = new QueryBuilder(requestQueries);

    const skip = queryBuilder.getSkip();
    const limit = queryBuilder.getLimit();
    const filters = queryBuilder.getFilters();
    const page = queryBuilder.getPage();

    const [applicationRequests, total] = await Promise.all([
      this.applicationRequest.find(filters).skip(skip).limit(limit),
      this.applicationRequest.countDocuments(),
    ]);

    return { applicationRequests, total, page, limit };
  }

  public async createNewApplication(
    applicationRequestData: IApplicationRequest
  ) {
    const session: ClientSession = await this.mongoose.startSession();
    session.startTransaction();

    try {
      const newApplicationRequest = new applicationRequestModel(
        applicationRequestData
      );
      const notification = new this.notification({
        owner: applicationRequestData.name,
        type: NotificationEnum.productCalculation,
      });

      await newApplicationRequest.save({ session });
      await notification.save({ session });

      await session.commitTransaction();
      return { newApplicationRequest };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  public async updateApplicationReq(id: string) {
    const request = await this.applicationRequest.findByIdAndUpdate(id, {
      seen: true,
    });

    if (!request) {
      throw new ApplicationRequestNotFoundException(id);
    }
    return { request };
  }

  public async deleteApplicationReq(id: string) {
    const deletedApplicationRequest =
      await this.applicationRequest.findByIdAndDelete(id);
    if (!deletedApplicationRequest) {
      throw new ApplicationRequestNotFoundException(id);
    }
  }
}

export default ApplicationRequestService;
