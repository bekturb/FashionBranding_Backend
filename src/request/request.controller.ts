import { NextFunction, Request, Response, Router } from "express";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateRequestDto } from "./request.dto";
import { IController } from "../interfaces/controller.interface";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import RequestService from "./request.service";
import { authMiddleware } from "../middleware/auth";

export class RequestController implements IController {
  public path: string = "/request";
  public router: Router = Router();
  public requestService = new RequestService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(
      this.path,
      validationMiddleware(CreateRequestDto),
      this.createRequest
    );
    this.router.get(this.path, authMiddleware, this.getAllRequests);
    this.router.get(`${this.path}/get-requests/chart`, authMiddleware, this.getChartRquests);
    this.router.get(`${this.path}/get-requests/by-week`, authMiddleware, this.getWeekRequests);
    this.router.get(`${this.path}/:id`, authMiddleware, this.getRequestById);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteRequest);
    this.router.patch(`${this.path}/:id/seen`, authMiddleware, this.updateSeenStatus);
  }

  private createRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requestData: CreateRequestDto = req.body;
      const { request } = await this.requestService.addRequest(requestData);
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
      const requestQueries: IRequestsQuery = req.query;

      const { requests, total, page, limit } =
        await this.requestService.getRequests(requestQueries);

      res.status(200).send({
        data: requests,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private getChartRquests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { data } = await this.requestService.hanldeChartRequests();
      res.status(200).send(data);
    } catch (err) {
      next(err);
    }
  };

  private getWeekRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { thisWeekData, lastWeekData, percentageChange } =
        await this.requestService.handleWeekRequests();

      res.status(200).send({
        thisWeek: thisWeekData,
        lastWeek: lastWeekData,
        percentageChange: percentageChange.toFixed(2),
      });
    } catch (err) {
      next(err);
    }
  };

  private getRequestById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const { request } = await this.requestService.getRequest(id);

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
      const { request } = await this.requestService.removeRequest(id);
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

      const { request } = await this.requestService.updateRequestSeenStatus(id);

      res.status(200).send({ request, message: "Успешно обновлено!" });
    } catch (error) {
      next(error);
    }
  };
}
