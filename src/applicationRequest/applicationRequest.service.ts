import mongoose, { ClientSession } from "mongoose";
import { ApplicationRequestNotFoundException } from "../exceptions/applicationRequestNotFound.exception";
import { applicationRequestModel } from "./applicationRequest.model";
import { QueryBuilder } from "../utils/queryBuilder";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import { IApplicationRequest } from "./applicationRequest.interface";
import { notificationModel } from "../notification/notification.model";
import NotificationEnum from "../notification/enum/notification.enum";
import { FileService } from "../s3/s3.service";

class ApplicationRequestService {
  public applicationRequest = applicationRequestModel;
  public notification = notificationModel;
  public fileService = new FileService();
  public mongoose = mongoose;
  public;

  public async getApplicationRequest(id: string) {
    const applicationRequest = await this.applicationRequest.findById(id);
    if (!applicationRequest) {
      throw new ApplicationRequestNotFoundException();
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
      this.applicationRequest.countDocuments(filters),
    ]);

    return { applicationRequests, total, page, limit };
  }

  public async createNewApplication(
    applicationRequestData: IApplicationRequest,
    fileUrl: string
  ) {
    const session: ClientSession = await this.mongoose.startSession();
    session.startTransaction();

    try {
      const ApplicationRequestDataWithImage = {
        ...applicationRequestData,
        image: fileUrl,
      };
      const newApplicationRequest = new applicationRequestModel(
        ApplicationRequestDataWithImage
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
      if (fileUrl) {
        await this.fileService.deleteFile(fileUrl);
      }
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
      throw new ApplicationRequestNotFoundException();
    }
    return { request };
  }

  public async deleteApplicationReq(id: string) {
    const deletedApplicationRequest =
      await this.applicationRequest.findByIdAndDelete(id);
    if (!deletedApplicationRequest) {
      throw new ApplicationRequestNotFoundException();
    }

    return { deletedApplicationRequest }
  }
}

export default ApplicationRequestService;
