import { HttpException } from './http.exception';

class WrongAuthenticationTokenException extends HttpException {
  constructor() {
    super(401, 'Неверный токен аутентификации');
  }
}

export default WrongAuthenticationTokenException;