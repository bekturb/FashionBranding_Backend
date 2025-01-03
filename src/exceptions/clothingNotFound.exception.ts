import { HttpException } from './http.exception';

export class ClothingNotFoundException extends HttpException {
  constructor(clothingId: string) {
    super(404, `Коллекция с номером #${clothingId} не найдена.`);
  }
}
