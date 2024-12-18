import { NextFunction, Request, Response, Router } from "express";
import { userModel } from "./user.model";
import { UserNotFoundException } from "../exceptions/userNotFound.exception";
import { IController } from "../interfaces/controller.interface";
import { IUser } from "./user.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { UpdateUserDto } from "./user.dto";

export class UserController implements IController {
  public path: string = "/users";
  public router: Router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }
  
  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getUserById);
    this.router.get(this.path, this.getAllUsers);
    this.router.patch(
      `${this.path}/:id`,
      validationMiddleware(UpdateUserDto),
      this.updateUser
    );
    this.router.delete(`${this.path}/:id`, this.deleteUser);
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
     *                 isEmailConfirmed:
     *                   type: boolean
     *                   example: true
     *                   description: The confirmation address of the user.
     *       404:
     *         description: User not found.
     */

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
 *                   isEmailConfirmed:
 *                     type: boolean
 *                     example: true
 *                     description: Indicates whether the user's email is confirmed.
 */


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

  /**
 * @swagger
 * /users/{id}:
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
 *               username:
 *                 type: string
 *                 example: Bektursun
 *                 description: The name of the user.
 *               image:
 *                 type: string
 *                 example: https://cdn.example.com/images/photo.jpg.
 *                 description: The image of the user.
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
 *                 image:
 *                   type: string
 *                   example: https://cdn.example.com/images/photo.jpg.
 *                   description: The image of the user.
 *       400:
 *         description: Invalid input or missing parameters.
 *       404:
 *         description: User not found.
 */


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
  
 /**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags:
 *       - Users
 *     description: Deletes a user by their unique ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The unique identifier of the user to delete.
 *         schema:
 *           type: string
 *           example: 64b2f0c7e11a4e6d8b16a8e2
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Internal server error.
 */

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
