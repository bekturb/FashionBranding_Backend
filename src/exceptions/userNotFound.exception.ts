import { HttpException } from './http.exception';

export class UserNotFoundException extends HttpException {
  constructor(userId: string) {
    super(404, `Пользователь с ID #${userId} не найден.`);
  }
}
