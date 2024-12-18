import { NextFunction, Request, Response, Router } from "express";
import { userModel } from "./user.model";
import { UserNotFoundException } from "../exceptions/userNotFound.exception";
import { IController } from "../interfaces/controller.interface";
import { IAdminPosition, IUser } from "./user.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { UpdateUserDto, UpdateUserPositionDto } from "./user.dto";

export class UserController implements IController {
  public path: string = "/users";
  public router: Router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }
   /**
     * @swagger
     * /users/{id}:
     *   get:
     *     summary: Get user by ID
     *     tags:
     *       - Users
     *     description: Retrieve a user's details by their unique ID.
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: The unique identifier of the user.
     *         schema:
     *           type: string
     *           example: 64b2f0c7e11a4e6d8b16a8e2
     *     responses:
     *       200:
     *         description: A user's details.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   description: The unique identifier of the user.
     *                 username:
     *                   type: string
     *                   example: Bektursun
     *                   description: The name of the user.
     *                 email:
     *                   type: string
     *                   example: bekkgboy2@gmail.com
     *                   description: The email address of the user.
     *       404:
     *         description: User not found.
     */

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getUserById);

      /**
     * @swagger
     * /users:
     *   get:
     *     summary: Get all users
     *     tags:
     *       - Users
     *     description: Retrieve a list of all users.
     *     responses:
     *       200:
     *         description: A list of users.
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *                 properties:
     *                   id:
     *                     type: string
     *                     description: The unique identifier of the user.
     *                   username:
     *                     type: string
     *                     example: Bektursun
     *                     description: The name of the user.
     *                   email:
     *                     type: string
     *                     example: bekkgboy2@gmail.com
     *                     description: The email address of the user.
     */


    this.router.get(this.path, this.getAllUsers);

    /**
 * @swagger
 * /users/{id}/select/admin:
 *   put:
 *     summary: Promote a user to admin
 *     tags:
 *       - Users
 *     description: Update a user's role to admin.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user to promote.
 *         schema:
 *           type: string
 *           example: 64b2f0c7e11a4e6d8b16a8e2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 example: admin
 *                 description: The role to assign to the user.
 *              position:
 *                 type: string
 *                 example: Manager of Fabric
 *                 description: The position to assign to the user.
 *     responses:
 *       200:
 *         description: User promoted to admin successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique ID of the user.
 *                 username:
 *                   type: string
 *                   example: Bektursun
 *                   description: The name of the user.
 *                 email:
 *                   type: string
 *                   example: bekkgboy2@gmail.com
 *                   description: The email address of the user.
 *                 role:
 *                   type: string
 *                   example: admin
 *                   description: The updated role of the user.
 *       400:
 *         description: Invalid input or missing parameters.
 *       404:
 *         description: User not found.
 */

    this.router.patch(
      `${this.path}/:id/select/admin`,
      validationMiddleware(UpdateUserPositionDto),
      this.createAdmin
    );
    this.router.put(
      `${this.path}/:id`,
      validationMiddleware(UpdateUserDto),
      this.updateUser
    );
    this.router.delete(`${this.path}/:id`, this.deleteUser);
  }

  private getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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

  private getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const users = await this.user.find();
      res.send(users);
    } catch (err) {
      next(err);
    }
  };

  private createAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userData: IAdminPosition = req.body;

      const updatedUser = await this.user.findByIdAndUpdate(id, userData, {
        new: true,
      });

      if (!updatedUser) {
        return next(new UserNotFoundException(id));
      }
      res.send(updatedUser);
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

      const updatedUser = await this.user.findByIdAndUpdate(id, userData, {
        new: true,
      });

      if (!updatedUser) {
        return next(new UserNotFoundException(id));
      }
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
