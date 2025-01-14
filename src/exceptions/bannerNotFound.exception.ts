import { HttpException } from './http.exception';

export class BannerNotFoundException extends HttpException {
  constructor() {
    super(404, `Баннер не найден!`);
  }
}