import { NextFunction, Request, Response, Router } from "express";
import * as multer from "multer";
import { IController } from "../interfaces/controller.interface";
import { IApplicationRequest } from "./applicationRequest.interface";
import { CreateApplicationRequestDto } from "./applicationRequest.dto";
import { validationMiddleware } from "../middleware/validation.middleware";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import ApplicationRequestService from "./applicationRequest.service";
import { FileService } from "../s3/s3.service";
import { authMiddleware } from "../middleware/auth";

export class ApplicationRequestController implements IController {
  public path: string = "/application-request";
  public router: Router = Router();
  public fileService = new FileService();
  public applicationRequestService = new ApplicationRequestService();
  private upload: multer.Multer;

  constructor() {
    this.upload = multer({ storage: multer.memoryStorage() });
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, authMiddleware, this.getApplicationRequestById);
    this.router.get(this.path, authMiddleware, this.getAllApplicationRequests);
    this.router.post(
      this.path,
      this.upload.single("image"),
      validationMiddleware(CreateApplicationRequestDto),
      this.createApplicationRequest
    );
    this.router.patch(`${this.path}/:id/seen`, authMiddleware, this.updateApplicationRequest);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteApplicationRequest);
  }

  private getApplicationRequestById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const { applicationRequest } =
        await this.applicationRequestService.getApplicationRequest(id);

      res.send(applicationRequest);
    } catch (err) {
      next(err);
    }
  };

  private getAllApplicationRequests = async (
    req: Request<unknown, unknown, unknown, IRequestsQuery>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requestQueries: IRequestsQuery = req.query;

      const { applicationRequests, total, page, limit } =
        await this.applicationRequestService.getApplicationRequests(
          requestQueries
        );

      res.status(200).send({
        data: applicationRequests,
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

  private createApplicationRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const applicationRequestData: IApplicationRequest = req.body;
      const file = req.file;
      let fileUrl;

      if (file) {
        fileUrl = await this.fileService.uploadFile(file);
      }

      const { newApplicationRequest } =
        await this.applicationRequestService.createNewApplication(
          applicationRequestData,
          fileUrl
        );
      res.status(201).send(newApplicationRequest);
    } catch (error) {
      next(error);
    }
  };

  private updateApplicationRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const { request } =
        await this.applicationRequestService.updateApplicationReq(id);

      res.status(200).send({ request, message: "Успешно обновлено!" });
    } catch (err) {
      next(err);
    }
  };

  private deleteApplicationRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;

    try {
      const { deletedApplicationRequest } = await this.applicationRequestService.deleteApplicationReq(id);
      if (deletedApplicationRequest.image) {
        await this.fileService.deleteFile(deletedApplicationRequest.image);
      }
      res.status(204).send({
        message: "Успешно удалено!",
      });
    } catch (err) {
      next(err);
    }
  };
}
