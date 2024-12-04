import { Request, Response, Router } from 'express';
import { IController } from '../interfaces/controller.interface';
import { clothesModel } from './clothes.model';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateClothesDto } from './clothes.dto';
import { NextFunction } from 'express-serve-static-core';
import { IClothes } from './clothes.interface';

export class ClothesController implements IController {
  public path = '/clothes';
  public router = Router();
  private clothes = clothesModel;

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getClothesById);
    this.router.get(this.path, this.getAllClothes);
    this.router.post(this.path, validationMiddleware(CreateClothesDto), this.createClothes);
  }

  private getClothesById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const doc = await this.clothes.findById(id);

      if (!doc) {
        res.status(404).json({ message: 'Clothes not found' });
      } else {
        res.status(200).json(doc);
      }
    } catch (err) {
      next(err);
    }
  };

  private getAllClothes = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const doc = await this.clothes.find();

      if (!doc) {
        res.status(404).json({ message: 'Clothes not found' });
      } else {
        res.status(200).json(doc);
      }
    } catch (err) {
      next(err);
    }
  };
  private createClothes = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const clothesData: IClothes = req.body;
      const newClothes = new clothesModel(clothesData);
      await newClothes.save();

      res.status(201).json(newClothes);
    } catch (err) {
      next(err);
    }
  };
}
