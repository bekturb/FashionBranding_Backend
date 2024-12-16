import 'dotenv/config';
import { UserController } from './user/user.controller';
import { App } from './app';
import { ClothingController } from './clothing/clothing.controller';
import { BannerController } from './banner/banner.controller';

const app = new App([new UserController(), new ClothingController(), new BannerController()]);

app.listen();
