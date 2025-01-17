import * as bodyParser from "body-parser";
import * as express from "express";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
import * as cors from "cors";
import * as compression from "compression";
import * as helmet from "helmet";
import GoogleAuth from "./utils/googleAuth";
import { IController } from "./interfaces/controller.interface";
import { errorMiddleware } from "./middleware/error.middleware";
import { corsOptions } from "./utils/cors.option";
import { connectToMongo } from "./lib/db";
import "./cron/cleanup";

export class App {
  public app: express.Application;

  constructor(controllers: IController[]) {
    this.app = express();
    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }

  private initializeMiddlewares() {
    this.app.use(helmet.default());
    this.app.use(compression());
    this.app.use(cors(corsOptions));
    this.app.use(session({
      secret: "#$%^&%^&*I",
      resave: false,
      saveUninitialized: false,
    }))
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(GoogleAuth.initialize());
    this.app.use(GoogleAuth.session());
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
    connectToMongo()
  }
}
