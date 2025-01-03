import { NotFoundException } from './notfound.exception';

export class ApplicationRequestNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Заявка с номером #${id} не найдена.`);
  }
}
