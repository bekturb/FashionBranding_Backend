import { NotFoundException } from './notfound.exception';

export class ApplicationRequestNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`application request #${id} not found`);
  }
}
