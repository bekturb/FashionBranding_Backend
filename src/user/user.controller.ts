import { NextFunction, Request, Response, Router } from 'express';
import { userModel } from './user.model';
import { UserNotFoundException } from '../exceptions/userNotFound.exception';

export class UserController {
  public path = '/user';
  public router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getUserById);
  }

  private getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const userQuery = this.user.findById(id);

    const user = await userQuery;
    if (user) {
      res.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  };
}
