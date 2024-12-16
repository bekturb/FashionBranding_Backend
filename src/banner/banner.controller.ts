import { NextFunction, Request, Response, Router } from 'express';
import { IController } from '../interfaces/controller.interface';
import { bannerModel } from './banner.model';
import { validationMiddleware } from '../middleware/validation.middleware';
import { CreateBannerDto, UpdateBannerDto } from './banner.dto';
import { BannerNotFoundException } from '../exceptions/bannerNotFoundException';
import { IBanner } from './banner.interface';

export class BannerController implements IController {
  public path: string = '/banner';
  public router: Router = Router();
  private banner = bannerModel;

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getBannerById);
    this.router.get(this.path, this.getAllBanner);
    this.router.post(this.path, validationMiddleware(CreateBannerDto), this.createBanner);
    this.router.patch(`${this.path}/:id`, validationMiddleware(UpdateBannerDto), this.updateBanner);
    this.router.delete(`${this.path}/:id`, this.deleteBanner);
  }

  private getBannerById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const doc = await this.banner.findById(id).lean();

      if (!doc) {
        next(BannerNotFoundException);
      } else {
        const { __v, ...cleanBanner } = doc;
        res.status(200).json(cleanBanner);
      }
    } catch (error) {
      next(error);
    }
  };
  private getAllBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banners = await this.banner.find().lean();

      const cleanedBanners = banners.map(({ __v, ...banner }) => banner);
      res.status(200).send(cleanedBanners);
    } catch (err) {
      next(err);
    }
  };

  private createBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bannerData: IBanner = req.body;
      const newBanner = new bannerModel(bannerData);

      res.status(201).json(newBanner);
    } catch (error) {
      next(error);
    }
  };

  private updateBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const bannerData: IBanner = req.body;

      const updatedBanner = await this.banner.findByIdAndUpdate(id, bannerData, { new: true });
      if (!updatedBanner) {
        return next(new BannerNotFoundException(id));
      }
      res.status(201).json(updatedBanner);
    } catch (error) {
      next(error);
    }
  };

  private deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deleteBanner = await this.banner.findByIdAndDelete(id);
      if (!deleteBanner) {
        return next(new BannerNotFoundException(id));
      }
      res.status(204).send('Баннер өчүрүлдү');
    } catch (error) {
      next(error);
    }
  };
}
