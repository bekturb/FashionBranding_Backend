import { NextFunction, Request, Response, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateClothingDto, UpdateClothingDto } from "./clothing.dto";
import { IClothing } from "./clothing.interface";
import ClothingService from "./clothing.service";
import { IRequestsQuery } from "interfaces/requestsQuery.interface";

export class ClothingController implements IController {
  public path = "/clothing";
  public router = Router();
  public clothingService = new ClothingService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getClothingById);
    this.router.get(this.path, this.getAllClothing);
    this.router.get(
      `${this.path}/get-clothing/by-chart`,
      this.getChartCollections
    );
    this.router.get(`${this.path}/get-today/clothing`, this.getTodaysClothing);
    this.router.post(
      this.path,
      validationMiddleware(CreateClothingDto),
      this.createClothing
    );
    this.router.patch(
      `${this.path}/:id`,
      validationMiddleware(UpdateClothingDto),
      this.updateClothing
    );
    this.router.delete(`${this.path}/:id`, this.deleteClothing);
  }

  /**
   * @swagger
   * /clothing/{id}:
   *   get:
   *     summary: Get collection by ID
   *     tags:
   *       - Collections
   *     description: Retrieve a collection's details by its unique ID.
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The unique identifier of the collection.
   *         schema:
   *           type: string
   *           example: 64b2f0c7e11a4e6d8b16a8e2
   *     responses:
   *       200:
   *         description: A collection's details.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: The unique ID of the collection.
   *                   example: 64b2f0c7e11a4e6d8b16a8e2
   *                 name:
   *                   type: string
   *                   description: The name associated with the collection.
   *                   example: Bektursun
   *                 image:
   *                   type: string
   *                   description: The image for the collection.
   *                   example: https://cdn.example.com/images/photo.jpg
   *                 material:
   *                   type: string
   *                   example: Lazer
   *                   description: The material of collection.
   *       404:
   *         description: Collection not found. The collection with the given ID does not exist.
   */

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

  /**
   * @swagger
   * /clothing:
   *   get:
   *     summary: Get all collections
   *     tags:
   *       - Collections
   *     description: Retrieve a list of all collections with optional filters and pagination.
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
   *     responses:
   *       200:
   *         description: A list of collections.
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
   *                       image:
   *                         type: string
   *                       category:
   *                         type: string
   *                       material:
   *                         type: string
   *                       description:
   *                         type: string
   *                       meta:
   *                        type: object
   *                        properties:
   *                          total:
   *                            type: number
   *                          page:
   *                            type: number
   *                          limit:
   *                            type: number
   *                          totalPages:
   *                            type: number
   *                   description: Total number of matching collections.
   */

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

  /**
   * @swagger
   * /clothing/get-clothing/by-chart:
   *   get:
   *     summary: Get collection for chart
   *     tags:
   *       - Collections
   *     description: Retrieve a collection's details for chart.
   *     responses:
   *       200:
   *         description: A collection's details in each month.
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

  /**
   * @swagger
   * /clothing/get-today/clothing:
   *   get:
   *     summary: Get today's collection
   *     tags:
   *       - Collections
   *     description: Retrieve today's collections.
   *     responses:
   *       200:
   *         description: A collection's details today.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 today:
   *                    type: number
   *                    example: 7
   *                 yesterday:
   *                    type: number
   *                    example: 0
   *                 percentageChange:
   *                    type: string
   *                    example: 100.00
   */

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

  /**
   * @swagger
   * /clothing:
   *   post:
   *     summary: Create a new collection
   *     tags:
   *       - Collections
   *     description: Create a new collection by providing the necessary details (e.g., name).
   *     requestBody:  # Corrected key
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - creatorId
   *               - image
   *               - category
   *               - material
   *               - description
   *             properties:
   *               name:
   *                 type: string
   *                 description: The name of the person who created the collection.
   *                 example: Bektursun
   *               creatorId:
   *                 type: string
   *                 description: The creator ID of the creator.
   *                 example: 64b2f0c7e11a4e6d8b16a8e2
   *               image:
   *                 type: string
   *                 description: The image of the collection.
   *                 example: https://cdn.example.com/images/photo.jpg
   *               category:
   *                 type: string
   *                 description: The category of the collection.
   *                 example: Лето
   *               material:
   *                 type: string
   *                 description: The material of the collection.
   *                 example: кожа
   *               description:
   *                 type: string
   *                 description: The description of the collection.
   *                 example: Lorem ipsum dolor sita amet
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
   *                   description: The unique ID of the newly created collection.
   *                   example: 64b2f0c7e11a4e6d8b16a8e2
   *                 name:
   *                   type: string
   *                   description: The name of the person who created the collection.
   *                   example: Bektursun
   *                 creatorId:
   *                   type: string
   *                   description: The creator ID of the creator.
   *                   example: 64b2f0c7e11a4e6d8b16a8e2
   *                 image:
   *                   type: string
   *                   description: The image of the collection.
   *                   example: https://cdn.example.com/images/photo.jpg
   *                 category:
   *                   type: string
   *                   description: The category of the collection.
   *                   example: Лето
   *                 material:
   *                   type: string
   *                   description: The material of the collection.
   *                   example: кожа
   *                 description:
   *                   type: string
   *                   description: The description of the collection.
   *                   example: Lorem ipsum dolor sita amet
   *       400:
   *         description: Invalid input or missing parameters.
   *       500:
   *         description: Internal server error.
   */

  private createClothing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const clothingData: IClothing = req.body;

      const { newClothing } = await this.clothingService.createNewCollection(
        clothingData
      );

      res.status(201).send(newClothing);
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
      const { updatedClothing } = await this.clothingService.updateCollection(
        id,
        collectionData
      );
      res.status(200).send(updatedClothing);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @swagger
   * /clothing/{id}:
   *   delete:
   *     summary: Delete a collection
   *     tags:
   *       - Collections
   *     description: Deletes a collection identified by its unique ID.
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The unique identifier of the collection to delete.
   *         schema:
   *           type: string
   *           example: 64b2f0c7e11a4e6d8b16a8e2
   *     responses:
   *       200:
   *         description: Collection deleted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Collection deleted successfully.
   *       404:
   *         description: Collection not found. The collection with the given ID does not exist.
   *       500:
   *         description: Internal server error. An error occurred while processing the request.
   */

  private deleteClothing = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.clothingService.deleteCollection(id);
      
      res.status(200).send({ message: "Successfully deleted" });
    } catch (err) {
      next(err);
    }
  };
}
