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
