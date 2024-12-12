import { FilterQuery } from "mongoose";
import { NextFunction, Request, Response, Router } from "express";
import { requestModel } from "./request.model";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateRequestDto } from "./request.dto";
import { IController } from "../interfaces/controller.interface";
import { IRequestsQuery } from "interfaces/requestsQuery.interface";
import { IRequest } from "./request.interface";
import { ApplicationRequestNotFoundException } from "../exceptions/applicationRequestNotFound.exception";

export class RequestController implements IController {
  public path: string = "/request";
  public router: Router = Router();
  private request = requestModel;

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(
      this.path,
      validationMiddleware(CreateRequestDto),
      this.createRequest
    );
    this.router.get(this.path, this.getAllRequests);
    this.router.get(`${this.path}/:id`, this.getRequestById);
  }

  private createRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requestData: CreateRequestDto = req.body;

      const request = new this.request(requestData);
      await request.save();

      res.status(201).send(request);
    } catch (err) {
      next(err);
    }
  };

  private getAllRequests = async (
    req: Request<unknown, unknown, unknown, IRequestsQuery>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = Math.max(parseInt(req.query.page || "1", 10), 1);
      const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
      const search = req.query.search?.trim() || "";
      const startDate = req.query.startDate
        ? new Date(req.query.startDate)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate)
        : undefined;
      const type = req.query.type;
      const skip = (page - 1) * limit;

      const filterQuery: FilterQuery<IRequest> = {};

      if (search) {
        filterQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }

      if (
        startDate &&
        !isNaN(startDate.getTime()) &&
        endDate &&
        !isNaN(endDate.getTime())
      ) {
        filterQuery.createdAt = {
          $gte: startDate,
          $lte: new Date(endDate.setHours(23, 59, 59, 999)),
        };
      } else if (startDate && !isNaN(startDate.getTime())) {
        filterQuery.createdAt = { $gte: startDate };
      } else if (endDate && !isNaN(endDate.getTime())) {
        filterQuery.createdAt = {
          $lte: new Date(endDate.setHours(23, 59, 59, 999)),
        };
      }

      if (type) {
        filterQuery.type = type;
      }

      const requests = await this.request
        .find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).send(requests);
    } catch (error) {
      next(error);
    }
  };

  private getRequestById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const request = await this.request.findById(id);

      if (!request) {
        return next(new ApplicationRequestNotFoundException(id));
      }

      res.send(request);
    } catch (err) {
      next(err);
    }
  };
}
