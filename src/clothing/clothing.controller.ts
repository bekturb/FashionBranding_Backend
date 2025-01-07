import { NextFunction, Request, Response, Router } from "express";
import * as multer from "multer";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateClothingDto, UpdateClothingDto } from "./clothing.dto";
import { IClothing } from "./clothing.interface";
import ClothingService from "./clothing.service";
import { IRequestsQuery } from "interfaces/requestsQuery.interface";
import { FileService } from "../s3/s3.service";
import { authMiddleware } from "../middleware/auth";

export class ClothingController implements IController {
  public path = "/clothing";
  public router = Router();
  public clothingService = new ClothingService();
  public fileService = new FileService();
  private upload: multer.Multer;

  constructor() {
    this.upload = multer({ storage: multer.memoryStorage() });
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getClothingById);
    this.router.get(this.path, this.getAllClothing);
    this.router.get(
      `${this.path}/get-clothing/by-chart`,
      authMiddleware,
      this.getChartCollections
    );
    this.router.get(`${this.path}/get-today/clothing`, authMiddleware, this.getTodaysClothing);
    this.router.post(
      this.path,
      authMiddleware,
      this.upload.single("image"),
      validationMiddleware(CreateClothingDto),
      this.createClothing
    );
    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      this.upload.single("image"),
      validationMiddleware(UpdateClothingDto),
      this.updateClothing
    );
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteClothing);
  }

  private getClothingById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const { clothing } = await this.clothingService.getCollection(id);

      res.status(200).send(clothing);
    } catch (err) {
      next(err);
    }
  };

  private getAllClothing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestQueries: IRequestsQuery = req.query;

      const { clothings, total, page, limit } =
        await this.clothingService.getCollections(requestQueries);

      res.status(200).send({
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

  private getChartCollections = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { data } = await this.clothingService.getCollectionsByChart();
      res.status(200).send(data);
    } catch (err) {
      next(err);
    }
  };

  private getTodaysClothing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { todayData, yesterdayData, percentageChange } =
        await this.clothingService.getTodaysCollections();

      res.status(200).send({
        today: todayData,
        yesterday: yesterdayData,
        percentageChange: percentageChange.toFixed(2),
      });
    } catch (err) {
      next(err);
    }
  };

  private createClothing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const clothingData: IClothing = req.body;
      const file = req.file;
      let fileUrl;

      if (file) {
        fileUrl = await this.fileService.uploadFile(file);
      }

      try {
        const { newClothing } = await this.clothingService.createNewCollection(
          clothingData,
          fileUrl
        );
        res.status(201).send(newClothing);
      } catch (error) {
        if (fileUrl) {
          await this.fileService.deleteFile(fileUrl);
        }
        next(error);
      }
    } catch (err) {
      next(err);
    }
  };

  private updateClothing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const collectionData: IClothing = req.body;
      const file: Express.Multer.File = req.file
      const { updatedClothing } = await this.clothingService.updateCollection(
        id,
        collectionData,
        file
      );
      res.status(200).send(updatedClothing);
    } catch (err) {
      next(err);
    }
  };

  private deleteClothing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const { deletedClothing } = await this.clothingService.deleteCollection(id);

      if (deletedClothing.image) {
        await this.fileService.deleteFile(deletedClothing.image);
      }

      res.status(200).send({ message: "Успешно удалено!" });
    } catch (err) {
      next(err);
    }
  };
}
