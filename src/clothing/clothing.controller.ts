import { NextFunction, Request, Response, Router } from 'express';
import { IController } from '../interfaces/controller.interface';
import { clothingModel } from './clothing.model';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateClothingDto, UpdateClothingDto } from './clothing.dto';
import { IClothing } from './clothing.interface';
import { ClothingNotFoundException } from '../exceptions/clothingNotFound.exception';

export class ClothingController implements IController {
  public path = '/clothing';
  public router = Router();
  private clothing = clothingModel;

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getClothingById);
    this.router.get(this.path, this.getAllClothing);
    this.router.post(this.path, validationMiddleware(CreateClothingDto), this.createClothing);
    this.router.patch(
      `${this.path}/:id`,
      validationMiddleware(UpdateClothingDto),
      this.updateClothing,
    );
    this.router.delete(`${this.path}/:id`, this.deleteClothing);
  }

  /**
 * @swagger
 * /clothing/{id}:
 *   get:
 *     summary: Get collection by ID
 *     tags:
 *       - Collections
 *     description: Retrieve a collection's details by its unique ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The unique identifier of the collection.
 *         schema:
 *           type: string
 *           example: 64b2f0c7e11a4e6d8b16a8e2
 *     responses:
 *       200:
 *         description: A collection's details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique ID of the collection.
 *                   example: 64b2f0c7e11a4e6d8b16a8e2
 *                 name:
 *                   type: string
 *                   description: The name associated with the collection.
 *                   example: Bektursun
 *                 image:
 *                   type: string
 *                   description: The image for the collection.
 *                   example: https://cdn.example.com/images/photo.jpg
 *                 material:
 *                   type: string
 *                   example: Lazer
 *                   description: The material of collection.
 *       404:
 *         description: Collection not found. The collection with the given ID does not exist.
 */

  private getClothingById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const doc = await this.clothing.findById(id);

      if (!doc) {
        next(ClothingNotFoundException);
      } else {
        res.status(200).json(doc);
      }
    } catch (err) {
      next(err);
    }
  };

  /**
 * @swagger
 * /clothing:
 *   get:
 *     summary: Get all collections
 *     tags:
 *       - Collections
 *     description: Retrieve a list of all collections with optional filters and pagination.
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *           description: The page number for pagination.
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           description: The number of items per page.
 *     responses:
 *       200:
 *         description: A list of collections.
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
 *                       name:
 *                         type: string
 *                       phoneNumber:
 *                         type: string
 *                       type:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   description: Total number of matching collections.
 */

  private getAllClothing = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [clothings, total] = await Promise.all([
        this.clothing.find().skip(skip).limit(limit),
        this.clothing.countDocuments(),
      ]);

      res.status(200).json({
        data: clothings,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
      
    } catch (err) {
      next(err);
    }
  };

  private createClothing = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const clothingData: IClothing = req.body;
      const newClothing = new clothingModel(clothingData);
      await newClothing.save();

      res.status(201).json(newClothing);
    } catch (err) {
      next(err);
    }
  };

  private updateClothing = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedClothing = await this.clothing.findByIdAndUpdate(id);

      if (!updatedClothing) {
        next(ClothingNotFoundException);
      } else {
        res.status(200).json(updatedClothing);
      }
    } catch (err) {
      next(err);
    }
  };
  private deleteClothing = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedClothing = await this.clothing.findByIdAndDelete(id);
      if (!deletedClothing) {
        next(ClothingNotFoundException);
      } else {
        res.status(200).json();
      }
    } catch (err) {
      next(err);
    }
  };
}
