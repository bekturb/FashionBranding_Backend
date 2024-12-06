import 'dotenv/config';
import { UserController } from './user/user.controller';
import { AuthenticationController } from './authentication/authentication.controller';
import { App } from './app';

const app = new App([
    new UserController(),
    new AuthenticationController(),
]);

app.listen();
