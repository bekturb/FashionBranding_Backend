import { NextFunction, Request, Response, Router } from 'express';
import { IController } from '../interfaces/controller.interface';
import { notificationModel } from './notification.model';
import { NotFoundException } from '../exceptions/notfound.exception';

export class NotificationController implements IController {
  public path: string = '/notification';
  public router: Router = Router();
  private notification = notificationModel;

	constructor() {
		this.initializeRoutes();
	}

	public initializeRoutes() {
        this.router.get(this.path, this.getAllNotifications);
        this.router.delete(`${this.path}/:id`, this.deleteNotification);
  }


  /**
 * @swagger
 * /notification:
 *   get:
 *     summary: Get all notifications
 *     tags:
 *       Notifications
 *     description: Retrieve a list of all notifications.
 *     responses:
 *       200:
 *         description: A list of notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       owner:
 *                         type: string
 *                       type:
 *                         type: string
 */

  private getAllNotifications = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      try {
        const notifications = await this.notification.find();
        res.status(200).send(notifications);
        
      } catch (err) {
        next(err);
      }
    };

  /**
 * @swagger
 * /notification/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags:
 *       Notifications
 *     description: Deletes a notification identified by its unique ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The unique identifier of the notification to delete.
 *         schema:
 *           type: string
 *           example: 64b2f0c7e11a4e6d8b16a8e2
 *     responses:
 *       200:
 *         description: Notification deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification deleted successfully.
 *       404:
 *         description: notification not found. The notification with the given ID does not exist.
 *       500:
 *         description: Internal server error. An error occurred while processing the request.
 */

  private deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deletedNotification = await this.notification.findByIdAndDelete(id);
      if (!deletedNotification) {
        return next(new NotFoundException("Not found notifcation"));
      }
      res.status(204).send({message: "Notification deleted succesfully"});
    } catch (err) {
      next(err);
    }
  };
}
 