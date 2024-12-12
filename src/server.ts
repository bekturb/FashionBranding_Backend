import 'dotenv/config';
import { UserController } from './user/user.controller';
import { App } from './app';
import { RequestController } from './request/request.controller';
import { NotificationController } from './notification/notification.controller';

const app = new App([
    new UserController(),
    new RequestController(),
    new NotificationController()
]);

app.listen();
