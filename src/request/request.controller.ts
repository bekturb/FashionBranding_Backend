import { NextFunction, Request, Response, Router } from "express";
import { requestModel } from "./request.model";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateRequestDto } from "./request.dto";
import { IController } from "../interfaces/controller.interface";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import { ApplicationRequestNotFoundException } from "../exceptions/applicationRequestNotFound.exception";
import { QueryBuilder } from "../utils/queryBuilder";

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
    this.router.delete(`${this.path}/:id`, this.deleteRequest);
    this.router.put(`${this.path}/:id/seen`, this.updateSeenStatus);
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
      const queryBuilder = new QueryBuilder(req.query);

      const skip = queryBuilder.getSkip();
      const limit = queryBuilder.getLimit();
      const filters = queryBuilder.getFilters();

      const requests = await this.request
        .find(filters)
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
        next(new ApplicationRequestNotFoundException(id));
      }

      res.send(request);
    } catch (err) {
      next(err);
    }
  };

  private deleteRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const request = await this.request.findByIdAndDelete(id);

      if (!request) {
        next(new ApplicationRequestNotFoundException(id));
      }

      res.status(204).send(request);
    } catch (err) {
      next(err);
    }
  };

  private updateSeenStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      
      const request = await this.request.findByIdAndUpdate(id, {
        seen: true,
      });

      console.log(request, "id");

      if (!request) {
        next(new ApplicationRequestNotFoundException(id));
      }

      res.status(200).send({message: "Updated successfully"});
    } catch (error) {
      next(error)
    }
  };
}
