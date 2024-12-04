import UserWithThatEmailAlreadyExistsException from "exceptions/UserWithThatEmailAlreadyExistsException";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { UserDto } from "user/user.dto";
import { userModel } from "user/user.model";
import TokenData from "interfaces/tokenData.interface";
import {IUser} from "user/user.interface";
import DataStoredInToken from "interfaces/dataStoredInToken";

class AuthenticationService {
  public user = userModel;

  public async register(userData: UserDto) {
    if (await this.user.findOne({ email: userData.email })) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await this.user.create({
      ...userData,
      password: hashedPassword,
    });
    const tokenData = this.createToken(user);
    const cookie = this.createCookie(tokenData);
    return {
      cookie,
      user,
    };
  }
  public createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
  }
  public createToken(user: IUser): TokenData {
    const expiresIn = 60 * 60;
    const secret = process.env.JWT_SECRET;
    const dataStoredInToken: DataStoredInToken = {
      _id: user._id,
    };
    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }
}

export default AuthenticationService;