import { NextFunction, Request, Response, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateBannerDto, UpdateBannerDto } from "./banner.dto";
import { IBanner } from "./banner.inteface";
import BannerService from "./banner.service";
import { authMiddleware } from "../middleware/auth";
import * as multer from "multer";
import { FileService } from "../s3/s3.service";

export class BannerController implements IController {
  public path: string = "/banner";
  public router: Router = Router();
  private bannerService = new BannerService();
  public fileService = new FileService();

  private upload: multer.Multer;

  constructor() {
    this.upload = multer({ storage: multer.memoryStorage() });
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, authMiddleware, this.getBannerById);
    this.router.get(this.path, this.getAllBanner);
    this.router.post(
      this.path,
      this.upload.fields([
        { name: "leftImages", maxCount: 3 },
        { name: "rightImages", maxCount: 1 },
      ]),
      validationMiddleware(CreateBannerDto, ["leftImages", "rightImages"]),
      this.createBanner
    ),
      this.router.patch(
        `${this.path}/:id`,
        this.upload.fields([
        { name: "leftImages", maxCount: 3 },
        { name: "rightImages", maxCount: 1 },
      ]),
      validationMiddleware(UpdateBannerDto, ["leftImages", "rightImages"]),
        this.updateBanner
      );
  }

  private getBannerById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { cleanBanner } = await this.bannerService.getBanner(id);
      res.status(200).send(cleanBanner);
    } catch (error) {
      next(error);
    }
  };
  private getAllBanner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cleanedBanners } = await this.bannerService.getBanners();
      res.status(200).send(cleanedBanners);
    } catch (err) {
      next(err);
    }
  };

  private createBanner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const bannerData: IBanner = req.body;
      const leftImages = req.files["leftImages"];
      const rightImages = req.files["rightImages"];

      const leftFileUrls = await this.fileService.uploadMultipleFiles(leftImages);
      const rightFileUrls = await this.fileService.uploadMultipleFiles(rightImages);

      const { newBanner } = await this.bannerService.createNewBanner(
        bannerData,
        leftFileUrls,
        rightFileUrls
      );

      res.status(201).send( newBanner );
    } catch (error) {
      next(error);
    }
  };

  private updateBanner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const bannerData: IBanner = req.body;
      const leftImages = req.files["leftImages"];
      const rightImages = req.files["rightImages"]; 
      
     const { updatedBanner } = await this.bannerService.updateBanner(id, bannerData, leftImages, rightImages)
        
      res.status(201).send(updatedBanner);
    } catch (error) {
      next(error);
    }
  };
}
