import { NextFunction, Request, Response, Router } from "express";
import { notificationModel } from "./notification.model";
import { IController } from "interfaces/controller.interface";
import { NotFoundException } from "../exceptions/notfound.exception";

export class NotificationController implements IController {
  public path: string = "/notification";
  public router: Router = Router();
  public notification = notificationModel;

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(this.path, this.getAllNotifications);
    this.router.get(`${this.path}/:id`, this.getNotification);
  }

  private getAllNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notifications = await this.notification.find();
      res.send(notifications);
    } catch (err) {
      next(err);
    }
  };

  private getNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const request = await this.notification.findById(id);

      if (!request) {
        return next(new NotFoundException(`Not found request by this ${id}`));
      }

      res.send(request);
    } catch (err) {
      next(err);
    }
  };
}
