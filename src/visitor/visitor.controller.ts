import { NextFunction, Request, Response, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import VisitorService from "./visitor.service";
import { authMiddleware } from "../middleware/auth";

export class VisitorController implements IController {
  public path: string = "/visitor";
  public router: Router = Router();
  private visitorService = new VisitorService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(`${this.path}/track`, this.createVisitorTrack);
    this.router.get(`${this.path}/compare-weeks`, authMiddleware, this.getVisitorsCompareWeeks);
    this.router.get(`${this.path}/chart-visitors`, authMiddleware, this.getChartVisitors);
  }

  private createVisitorTrack: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void = async (req, res, next) => {
    try {
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const { page = "/" } = req.body;

      const visitor = await this.visitorService.createVisitor(
        ip,
        userAgent,
        page
      );

      res.status(visitor.statusCode).send(visitor.response);
    } catch (err) {
      next(err);
    }
  };

  private getVisitorsCompareWeeks: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void = async (req, res, next) => {
    try {
      const visitors = await this.visitorService.getWeeksVisitors();

      res.status(200).send({
        data: visitors.data,
      });
    } catch (err) {
      next(err);
    }
  };

  private getChartVisitors: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void = async (req, res, next) => {
    try {
      const { visitors } = await this.visitorService.getChartVisitorsByWeek();

      res.status(200).send({
        data: visitors,
      });
    } catch (err) {
      next(err);
    }
  };
}
