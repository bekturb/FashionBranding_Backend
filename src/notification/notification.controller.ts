import { NextFunction, Request, Response, Router } from 'express';
import { IController } from '../interfaces/controller.interface';
import NotificationService from './notification.service';
import { authMiddleware } from '../middleware/auth';

export class NotificationController implements IController {
  public path: string = '/notification';
  public router: Router = Router();
  public notificationService = new NotificationService() 

	constructor() {
		this.initializeRoutes();
	}

	public initializeRoutes() {
        this.router.get(this.path, authMiddleware, this.getAllNotifications);
        this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteNotification);
  }

  private getAllNotifications = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const { notifications } = await this.notificationService.getNotifications();
        res.status(200).send(notifications);
        
      } catch (err) {
        next(err);
      }
    };

  private deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.notificationService.removeNotification(id)
      res.status(204).send({message: "Уведомление успешно удалено!"});
    } catch (err) {
      next(err);
    }
  };
}
 