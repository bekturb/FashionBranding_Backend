import 'dotenv/config';
import { UserController } from './user/user.controller';
import { App } from './app';
import { ClothingController } from './clothing/clothing.controller';

const app = new App([new UserController(), new ClothingController()]);

app.listen();
