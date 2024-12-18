import * as bodyParser from "body-parser";
import * as express from "express";
import * as swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import { IController } from "./interfaces/controller.interface";
import { errorMiddleware } from "./middleware/error.middleware";
import { swaggerSpec } from "./swagger";

export class App {
  public app: express.Application;

  constructor(controllers: IController[]) {
    this.app = express();

    this.connectToTheDatabase();
    this.setupSwagger();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }

  private setupSwagger() {
    this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  private initializeMiddlewares() {
    this.app.use(bodyParser.json());
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers) {
    controllers.forEach((controller) => {
      this.app.use("/", controller.router);
    });
  }

  private connectToTheDatabase() {
    const { MONGO_PATH } = process.env;
    mongoose.set("strictQuery", false);
    mongoose.connect(MONGO_PATH);
  }
}
