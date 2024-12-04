import 'dotenv/config';
import { UserController } from './user/user.controller';
import { App } from './app';
import { ClothesController } from './clothes/clothes.controller';

const app = new App([new UserController(), new ClothesController()]);

app.listen();
