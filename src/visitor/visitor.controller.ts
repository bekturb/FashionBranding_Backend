import { NextFunction, Request, Response, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import VisitorService from "./visitor.service";

export class VisitorController implements IController {
  public path: string = "/visitor";
  public router: Router = Router();
  private visitorService = new VisitorService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(`${this.path}/track`, this.createVisitorTrack);
    this.router.get(`${this.path}/compare-weeks`, this.getVisitorsCompareWeeks);
    this.router.get(`${this.path}/chart-visitors`, this.getChartVisitors);
  }

  /**
   * @swagger
   * /visitor/track:
   *   post:
   *     summary: Create a new visitor
   *     tags:
   *       - Visitors
   *     description: Create a new visitor by providing the necessary details.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - page
   *             properties:
   *               page:
   *                 type: string
   *                 description: The page of the person making the visitor.
   *                 example: "/"
   *     responses:
   *       201:
   *         description: Request created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: The unique ID of the newly created visitor.
   *                   example: 64b2f0c7e11a4e6d8b16a8e2
   *                 ip:
   *                   type: string
   *                   description: The ip of the person who created the visitor.
   *                   example: Bektursun
   *                 userAgent:
   *                   type: string
   *                   description: The ip of the person who created the visitor.
   *                   example: Bektursun
   *                 visitHistory:
   *                   type: array
   *                   description: The ip of the person who created the visitor.
   *                   example: ["2024-12-31T03:10:25.979Z", "2024-12-31T03:10:32.009Z"]
   */

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

  /**
   * @swagger
   * /visitor/compare-weeks:
   *   get:
   *     summary: Get all visitors
   *     tags:
   *       - Visitors
   *     description: Retrieve a list of all visitors with optional filters and pagination.
   *     responses:
   *       200:
   *         description: A list of visitors.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                   data:
   *                     type: object
   *                     properties:
   *                       thisWeek:
   *                         type: number
   *                       lastWeek:
   *                         type: number
   */

  private getVisitorsCompareWeeks: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => void = async (req, res, next) => {
    try {
      const visitors = await this.visitorService.getWeeksVisitors();

      res.status(200).send({
        message: "Weekly comparison retrieved successfully",
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
        message: "Weekly comparison retrieved successfully",
        data: visitors,
      });
    } catch (err) {
      next(err);
    }
  };
}
