import { NextFunction, Request, Response, Router } from "express";
import { requestModel } from "./request.model";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateRequestDto } from "./request.dto";
import { IController } from "../interfaces/controller.interface";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import { ApplicationRequestNotFoundException } from "../exceptions/applicationRequestNotFound.exception";
import { QueryBuilder } from "../utils/queryBuilder";

export class RequestController implements IController {
  public path: string = "/request";
  public router: Router = Router();
  private request = requestModel;

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

      const request = new this.request(requestData);
      await request.save();

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
 *     description: Retrieve a list of all requests.
 *     responses:
 *       200:
 *         description: A list of requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique ID of the request.
 *                     example: 64b2f0c7e11a4e6d8b16a8e2
 *                   name:
 *                     type: string
 *                     description: The name associated with the request.
 *                     example: Bektursun
 *                   phoneNumber:
 *                     type: string
 *                     description: The phone number for the request.
 *                     example: +996220643466
 *                   type:
 *                     type: string
 *                     description: The type of request.
 *                     enum:
 *                       - order_excursion
 *                       - additional_question
 *                       - contact_us
 *                     example: order_excursion
 */



  private getAllRequests = async (
    req: Request<unknown, unknown, unknown, IRequestsQuery>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const queryBuilder = new QueryBuilder(req.query);

      const skip = queryBuilder.getSkip();
      const limit = queryBuilder.getLimit();
      const filters = queryBuilder.getFilters();

      const requests = await this.request
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).send(requests);
    } catch (error) {
      next(error);
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

      const request = await this.request.findById(id);

      if (!request) {
        next(new ApplicationRequestNotFoundException(id));
      }

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

      const request = await this.request.findByIdAndDelete(id);

      if (!request) {
        next(new ApplicationRequestNotFoundException(id));
      }

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
      
      const request = await this.request.findByIdAndUpdate(id, {
        seen: true,
      });

      console.log(request, "id");

      if (!request) {
        next(new ApplicationRequestNotFoundException(id));
      }

      res.status(200).send({message: "Updated successfully"});
    } catch (error) {
      next(error)
    }
  };
}
