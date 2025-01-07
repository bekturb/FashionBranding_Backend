import { HttpException } from './http.exception';

export class  UserWithThatEmailAlreadyExistsException extends HttpException {
  constructor() {
    super(400, `Пользователь с данным e-mail уже существует`);
  }
}