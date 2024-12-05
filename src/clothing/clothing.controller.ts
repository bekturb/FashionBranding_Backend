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
        res.status(404).json({ message: 'Clothing not found' });
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
      const clothings = await this.clothing.find();

      if (!clothings) {
        res.status(404).json({ message: 'Clothing not found' });
      } else {
        res.status(200).json(clothings);
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
        res.status(404).json({ message: 'Clothing not found' });
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
        res.status(404).json({ message: 'Clothing not found' });
      } else {
        res.status(200).json();
      }
    } catch (err) {
      next(err);
    }
  };
}
