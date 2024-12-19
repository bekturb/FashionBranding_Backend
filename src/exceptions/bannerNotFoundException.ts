import { HttpException } from './http.exception';

export class BannerNotFoundException extends HttpException {
  constructor(bannerId: string) {
    super(404, `banner #${bannerId} not found`);
  }
}
