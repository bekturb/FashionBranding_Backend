import { NextFunction, Request, Response, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import { IApplicationRequest } from "./applicationRequest.interface";
import { CreateApplicationRequestDto } from "./applicationRequest.dto";
import { validationMiddleware } from "../middleware/validation.middleware";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import ApplicationRequestService from "./applicationRequest.service";

export class ApplicationRequestController implements IController {
  public path: string = "/application-request";
  public router: Router = Router();
  public applicationRequestService = new ApplicationRequestService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getApplicationRequestById);
    this.router.get(this.path, this.getAllApplicationRequests);
    this.router.post(
      this.path,
      validationMiddleware(CreateApplicationRequestDto),
      this.createApplicationRequest
    );
    this.router.patch(`${this.path}/:id/seen`, this.updateApplicationRequest);
    this.router.delete(`${this.path}/:id`, this.deleteApplicationRequest);
  }

  /**
   * @swagger
   * //application-request/{id}:
   *   get:
   *     summary: Get request by ID
   *     tags:
   *       - Application-request
   *     description: Retrieve a request's details by its unique ID.
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The unique identifier of the request.
   *         schema:
   *           type: string
   *           example: 64b2f0c7e11a4e6d8b16a8e2
   *     responses:
   *       200:
   *         description: A request's details.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: The unique ID of the request.
   *                   example: 64b2f0c7e11a4e6d8b16a8e2
   *                 name:
   *                   type: string
   *                   description: The name associated with the request.
   *                   example: Bektursun
   *                 phoneNumber:
   *                   type: string
   *                   description: The phone number for the request.
   *                   example: +996220643466
   *                 textileName:
   *                   type: string
   *                   example: Lazer
   *                   description: The textileName of request.
   *                 size:
   *                   type: string
   *                   example: XXL
   *                   description: The size of request.
   *       404:
   *         description: Request not found. The request with the given ID does not exist.
   */

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

  /**
   * @swagger
   * /application-request:
   *   get:
   *     summary: Get all requests
   *     tags:
   *       - Application-request
   *     description: Retrieve a list of all requests with optional filters and pagination.
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
   *       - name: search
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           description: Search keyword for filtering requests by name or phone number.
   *       - name: startDate
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *           description: Start date for filtering requests.
   *       - name: endDate
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *           description: End date for filtering requests.
   *     responses:
   *       200:
   *         description: A list of requests.
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
   *                       textileName:
   *                         type: string
   *                       size:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 total:
   *                   type: integer
   *                   description: Total number of matching requests.
   */

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

  /**
   * @swagger
   * /application-request:
   *   post:
   *     summary: Create a new application-request
   *     tags:
   *       - Application-request
   *     description: Create a new application-request by providing the necessary details (e.g., name, phone number, textileName and size).
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - phoneNumber
   *               - type
   *             properties:
   *               name:
   *                 type: string
   *                 description: The name of the person making the request.
   *                 example: Bektursun
   *               phoneNumber:
   *                 type: string
   *                 description: The phone number for contact.
   *                 example: +996220643466
   *               textileName:
   *                 type: string
   *                 example: Lazer
   *                 description: The textileName of request.
   *               size:
   *                 type: string
   *                 example: XL
   *                 description: The size of request.
   *     responses:
   *       201:
   *         description: Request created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: The unique ID of the newly created request.
   *                   example: 64b2f0c7e11a4e6d8b16a8e2
   *                 name:
   *                   type: string
   *                   description: The name of the person who created the request.
   *                   example: Bektursun
   *                 phoneNumber:
   *                   type: string
   *                   description: The phone number associated with the request.
   *                   example: +996220643466
   *                 textileName:
   *                   type: string
   *                   example: Lazer
   *                   description: The textileName of request.
   *                 size:
   *                   type: string
   *                   example: XL
   *                   description: The size of request.
   *       400:
   *         description: Invalid input or missing parameters.
   *       500:
   *         description: Internal server error.
   */

  private createApplicationRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const applicationRequestData: IApplicationRequest = req.body;
    try {
      const { newApplicationRequest } =
        await this.applicationRequestService.createNewApplication(
          applicationRequestData
        );
      res.status(201).send(newApplicationRequest);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /application-request/{id}/seen:
   *   patch:
   *     summary: Update the 'seen' status to true
   *     tags:
   *       - Application-request
   *     description: Update the 'seen' status to true for a request identified by its unique ID.
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The unique identifier of the request whose 'seen' status will be updated.
   *         schema:
   *           type: string
   *           example: 64b2f0c7e11a4e6d8b16a8e2
   *     responses:
   *       200:
   *         description: Successfully updated the 'seen' status.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: 'Seen status updated successfully.'
   *       404:
   *         description: Request not found. The request with the given ID does not exist.
   *       500:
   *         description: Internal server error. An error occurred while processing the request.
   */

  private updateApplicationRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const { request } =
        await this.applicationRequestService.updateApplicationReq(id);

      res.status(200).send({ request, message: "Updated successfully" });
    } catch (err) {
      next(err);
    }
  };

  /**
   * @swagger
   * /application-request/{id}:
   *   delete:
   *     summary: Delete a request
   *     tags:
   *       - Application-request
   *     description: Deletes a request identified by its unique ID.
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The unique identifier of the request to delete.
   *         schema:
   *           type: string
   *           example: 64b2f0c7e11a4e6d8b16a8e2
   *     responses:
   *       200:
   *         description: Request deleted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Request deleted successfully.
   *       404:
   *         description: Request not found. The request with the given ID does not exist.
   *       500:
   *         description: Internal server error. An error occurred while processing the request.
   */

  private deleteApplicationRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;

    try {
       await this.applicationRequestService.deleteApplicationReq(id);
      res.status(204).send({
        message: "Successfully deleted",
      });
    } catch (err) {
      next(err);
    }
  };
}
