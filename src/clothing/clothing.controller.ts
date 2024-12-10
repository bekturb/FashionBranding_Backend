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

      if (!clothings || clothings.length === 0) {
        next(ClothingNotFoundException);
      } else {
        res.status(200).json({
          data: clothings,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        });
      }
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
