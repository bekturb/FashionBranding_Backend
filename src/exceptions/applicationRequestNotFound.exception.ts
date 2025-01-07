import { NotFoundException } from './notfound.exception';

export class ApplicationRequestNotFoundException extends NotFoundException {
  constructor() {
    super(`Заявка не найдена.`);
  }
}
