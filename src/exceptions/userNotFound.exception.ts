import { HttpException } from './http.exception';

export class UserNotFoundException extends HttpException {
  constructor() {
    super(404, `Пользователь не найден.`);
  }
}
