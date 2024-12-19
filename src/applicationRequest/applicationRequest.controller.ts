import { NextFunction, Request, Response, Router } from 'express';
import { IController } from '../interfaces/controller.interface';
import { IApplicationRequest } from './applicationRequest.interface';
import { applicationRequestModel } from './applicationRequest.model';
import { ApplicationRequestNotFoundException } from '../exceptions/applicationRequestNotFound.exception';
import { CreateApplicationRequestDto, UpdateApplicationRequestDto } from './applicationRequest.dto';
import { validationMiddleware } from '../middleware/validation.middleware';
import { IRequestsQuery } from '../interfaces/requestsQuery.interface';
import { QueryBuilder } from '../utils/queryBuilder';

export class ApplicationRequestController implements IController {
  public path: string = '/application-request';
  public router: Router = Router();
	private applicationRequest = applicationRequestModel;

	constructor() {
		this.initializeRoutes();
	}

	public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getApplicationRequestById);
    this.router.get(this.path, this.getAllApplicationRequests);
    this.router.post(this.path, validationMiddleware(CreateApplicationRequestDto), this.createApplicationRequest);
    this.router.patch(`${this.path}/:id`, validationMiddleware(UpdateApplicationRequestDto), this.updateApplicationRequest);
    this.router.delete(`${this.path}/:id`, this.deleteApplicationRequest);
  }

  private getApplicationRequestById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const applicationRequest = await this.applicationRequest.findById(id);

      if (!applicationRequest) {
        return next(new ApplicationRequestNotFoundException(id));
      }

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
      const queryBuilder = new QueryBuilder(req.query);      

      const skip = queryBuilder.getSkip();
      const limit = queryBuilder.getLimit();
      const filters = queryBuilder.getFilters();

      const applicationRequests = await this.applicationRequest
      .find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

      res.status(200).send(applicationRequests);
      
    } catch (err) {
      next(err);
    }
  };

  private createApplicationRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const applicationRequestData: IApplicationRequest = req.body;
      const newApplicationRequest = new applicationRequestModel(applicationRequestData);
      await newApplicationRequest.save();

      res.status(201).send(newApplicationRequest);
    } catch (err) {
      next(err);
    }
  };

  private updateApplicationRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const applicationRequestData: IApplicationRequest = req.body;

      const updatedApplicationRequest = await this.applicationRequest.findByIdAndUpdate(id, applicationRequestData, { new: true });

      if (!updatedApplicationRequest) {
        return next(new ApplicationRequestNotFoundException(id));
      }
      res.send(updatedApplicationRequest);
    } catch (err) {
      next(err);
    }
  };

  private deleteApplicationRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const deletedApplicationRequest = await this.applicationRequest.findByIdAndDelete(id);
      if (!deletedApplicationRequest) {
        return next(new ApplicationRequestNotFoundException(id));
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
 