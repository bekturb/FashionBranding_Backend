import { NextFunction, Request, Response, Router } from 'express';
import { userModel } from './user.model';
import { UserNotFoundException } from '../exceptions/userNotFound.exception';
import { IController } from '../interfaces/controller.interface';
import { IUser } from './user.interface';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateUserDto, UpdateUserDto } from './user.dto';

export class UserController implements IController {
  public path: string = '/user';
  public router: Router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getUserById);
    this.router.get(this.path, this.getAllUsers);
    this.router.post(this.path, validationMiddleware(CreateUserDto), this.createUser);
    this.router.patch(`${this.path}/:id`, validationMiddleware(UpdateUserDto), this.updateUser);
    this.router.delete(`${this.path}/:id`, this.deleteUser);
  }

  public getHello = async (req: Request, res: Response) => {
    res.send('Hello world');
  };

  private getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await this.user.findById(id);

      if (!user) {
        return next(new UserNotFoundException(id));
      }

      res.send(user);
    } catch (err) {
      next(err);
    }
  };

  private getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.user.find().select("+password");
      res.send(users);
    } catch (err) {
      next(err);
    }
  };

  private createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData: IUser = req.body;
      const newUser = new userModel(userData);
      await newUser.save();

      res.status(201).send(newUser);
    } catch (err) {
      next(err);
    }
  };

  private updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userData: IUser = req.body;

      const updatedUser = await this.user.findByIdAndUpdate(id, userData, { new: true });

      if (!updatedUser) {
        return next(new UserNotFoundException(id));
      }
      res.send(updatedUser);
    } catch (err) {
      next(err);
    }
  };

  private deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deletedUser = await this.user.findByIdAndDelete(id);
      if (!deletedUser) {
        return next(new UserNotFoundException(id));
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
