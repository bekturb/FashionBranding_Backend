import { HttpException } from './http.exception';

export class ClothingNotFoundException extends HttpException {
  constructor() {
    super(404, `Коллекция не найдена.`);
  }
}
