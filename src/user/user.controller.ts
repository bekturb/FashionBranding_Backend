import { NextFunction, Request, Response, Router } from "express";
import * as multer from "multer";
import { IController } from "../interfaces/controller.interface";
import { IUser } from "./user.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { UpdateUserDto } from "./user.dto";
import userService from "./user.service";
import { FileService } from "../s3/s3.service";
import { authMiddleware } from "../middleware/auth";

export class UserController implements IController {
  public path: string = "/users";
  public router: Router = Router();
  private userService = new userService();
  public fileService = new FileService();
  private upload: multer.Multer;

  constructor() {
    this.upload = multer({ storage: multer.memoryStorage() });
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, authMiddleware, this.getUserById);
    this.router.get(this.path, authMiddleware, this.getAllUsers);
    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      this.upload.single("image"),
      validationMiddleware(UpdateUserDto),
      this.updateUser
    );
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteUser);
  }

  private getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { user } = await this.userService.getUser(id);
      res.send(user);
    } catch (err) {
      next(err);
    }
  };

  private getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { users } = await this.userService.getUsers();
      res.send(users);
    } catch (err) {
      next(err);
    }
  };

  private updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userData: IUser = req.body;
      const file: Express.Multer.File = req.file
      const { updatedUser } = await this.userService.updateUserProfile(
        id,
        userData,
        file
      );
      res.send(updatedUser);
    } catch (err) {
      next(err);
    }
  };

  private deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const {deletedUser} = await this.userService.removeUser(id);

      if (deletedUser.image) {
        await this.fileService.deleteFile(deletedUser.image);
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
