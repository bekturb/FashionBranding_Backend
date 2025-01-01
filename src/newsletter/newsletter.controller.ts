import { NextFunction, Request, Response, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import { INewsletter } from "./newsletter.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateNewsletterDto } from "./newsletter.dto";
import NewsletterService from "./newsletter.service";

export class NewsletterController implements IController {
  public path: string = "/newsletter";
  public router: Router = Router();
  public newsletterService = new NewsletterService();

  constructor() {
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post(
      `${this.path}`,
      validationMiddleware(CreateNewsletterDto),
      this.createNewsletter
    );
  }

  /**
   * @swagger
   * /newsletter:
   *   post:
   *     summary: Create a new newsletter
   *     tags:
   *       - Newsletter
   *     description: Create a new newsletter by providing the necessary details (e.g., email).
   *     requestBody:  # Corrected key
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 description: The email of the person who created the newsletter.
   *                 example: bek@gmail.com
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
   *                   description: The unique ID of the newly created newsletter.
   *                   example: 64b2f0c7e11a4e6d8b16a8e2
   *                 email:
   *                   type: string
   *                   description: The email of the person who created the newsletter.
   *                   example: bek@gmail.com
   *       400:
   *         description: Invalid input or missing parameters.
   *       500:
   *         description: Internal server error.
   */

  private createNewsletter = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const newsletterData: INewsletter = req.body;
      
      const { newNewsletter } = await this.newsletterService.postNewsletterEmail(newsletterData)

      res.status(201).send(newNewsletter);
    } catch (err) {
      next(err);
    }
  };
}
