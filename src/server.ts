import "dotenv/config";
import { App } from "./app";
import { UserController } from "./user/user.controller";
import { AuthenticationController } from "./authentication/authentication.controller";
import { RequestController } from "./request/request.controller";
import { ClothingController } from "./clothing/clothing.controller";
import { ApplicationRequestController } from "./applicationRequest/applicationRequest.controller";
import { EmployeeController } from "./employees/employee.controller";
import { NotificationController } from "./notification/notification.controller";
import { NewsletterController } from "./newsletter/newsletter.controller";
import { VisitorController } from "./visitor/visitor.controller";
import { BannerController } from "./banner/banner.controller";

const app = new App([
  new AuthenticationController(),
  new UserController(),
  new ClothingController(),
  new BannerController(),
  new RequestController(),
  new ApplicationRequestController(),
  new EmployeeController(),
  new NotificationController(),
  new NewsletterController(),
  new VisitorController(),
]);

app.listen();
