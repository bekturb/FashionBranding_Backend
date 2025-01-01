import { NextFunction, Request, Response, Router } from "express";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateRequestDto } from "./request.dto";
import { IController } from "../interfaces/controller.interface";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import RequestService from "./request.service";

export class RequestController implements IController {
  public path: string = "/request";
  public router: Router = Router();
  public requestService = new RequestService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(
      this.path,
      validationMiddleware(CreateRequestDto),
      this.createRequest
    );
    this.router.get(this.path, this.getAllRequests);
    this.router.get(`${this.path}/get-requests/chart`, this.getChartRquests);
    this.router.get(`${this.path}/get-requests/by-week`, this.getWeekRequests);
    this.router.get(`${this.path}/:id`, this.getRequestById);
    this.router.delete(`${this.path}/:id`, this.deleteRequest);
    this.router.patch(`${this.path}/:id/seen`, this.updateSeenStatus);
  }

  /**
   * @swagger
   * /request:
   *   post:
   *     summary: Create a new request
   *     tags:
   *       - Requests
   *     description: Create a new request by providing the necessary details (e.g., name, phone number, and request type).
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
   *               type:
   *                 type: string
   *                 description: The type of request.
   *                 enum:
   *                   - order_excursion
   *                   - additional_question
   *                   - contact_us
   *                 example: order_excursion
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
   *                 type:
   *                   type: string
   *                   description: The type of request.
   *                   enum:
   *                     - order_excursion
   *                     - additional_question
   *                     - contact_us
   *                   example: order_excursion
   *       400:
   *         description: Invalid input or missing parameters.
   *       500:
   *         description: Internal server error.
   */

  private createRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requestData: CreateRequestDto = req.body;
      const { request } = await this.requestService.addRequest(requestData);
      res.status(201).send(request);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @swagger
   * /request:
   *   get:
   *     summary: Get all requests
   *     tags:
   *       - Requests
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
   *                       type:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 total:
   *                   type: integer
   *                   description: Total number of matching requests.
   */

  private getAllRequests = async (
    req: Request<unknown, unknown, unknown, IRequestsQuery>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const requestQueries: IRequestsQuery = req.query;

      const { requests, total, page, limit } =
        await this.requestService.getRequests(requestQueries);

      res.status(200).send({
        data: requests,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /request/get-requests/chart:
   *   get:
   *     summary: Get request for chart
   *     tags:
   *       - Requests
   *     description: Retrieve a request's details for chart.
   *     responses:
   *       200:
   *         description: A request's details in each month.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 name:
   *                    type: string,
   *                    example: Oct
   *                 pv:
   *                    type: number,
   *                    example: 450
   *                 amt:
   *                    type: number,
   *                    example: 22
   *                 uv:
   *                    type: number,
   *                    example: 450
   */

  private getChartRquests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { data } = await this.requestService.hanldeChartRequests();
      res.status(200).send(data);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @swagger
   * /request/get-requests/by-week:
   *   get:
   *     summary: Get this week requests
   *     tags:
   *       - Requests
   *     description: Retrieve  this week's requests.
   *     responses:
   *       200:
   *         description: A requests's details this week.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 thisWeek:
   *                    type: number
   *                    example: 25
   *                 lastWeek:
   *                    type: number
   *                    example: 0
   *                 percentageChange:
   *                    type: string
   *                    example: 100.00
   */

  private getWeekRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { thisWeekData, lastWeekData, percentageChange } =
        await this.requestService.handleWeekRequests();

      res.status(200).send({
        thisWeek: thisWeekData,
        lastWeek: lastWeekData,
        percentageChange: percentageChange.toFixed(2),
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * @swagger
   * /request/{id}:
   *   get:
   *     summary: Get request by ID
   *     tags:
   *       - Requests
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
   *                 type:
   *                   type: string
   *                   description: The type of request.
   *                   enum:
   *                     - order_excursion
   *                     - additional_question
   *                     - contact_us
   *                   example: order_excursion
   *       404:
   *         description: Request not found. The request with the given ID does not exist.
   */

  private getRequestById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const { request } = await this.requestService.getRequest(id);

      res.send(request);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @swagger
   * /request/{id}:
   *   delete:
   *     summary: Delete a request
   *     tags:
   *       - Requests
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

  private deleteRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { request } = await this.requestService.removeRequest(id);
      res.status(204).send(request);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @swagger
   * /request/{id}/seen:
   *   patch:
   *     summary: Update the 'seen' status to true
   *     tags:
   *       - Requests
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

  private updateSeenStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const { request } = await this.requestService.updateRequestSeenStatus(id);

      res.status(200).send({ request, message: "Updated successfully" });
    } catch (error) {
      next(error);
    }
  };
}
