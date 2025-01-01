import { UserNotFoundException } from "../exceptions/userNotFound.exception";
import { userModel } from "./user.model";
import { IUser } from "./user.interface";

class userService {
  public user = userModel;
  public;

  public async getUser(id: string) {
    const user = await this.user.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return { user };
  }

  public async getUsers() {
    const users = await this.user.find().select("+password");
    return { users };
  }

  public async updateUserProfile(id: string, userData: IUser) {
    const updatedUser = await this.user.findByIdAndUpdate(id, userData, {
      new: true,
    });

    if (!updatedUser) {
      throw new UserNotFoundException(id);
    }

    return { updatedUser };
  }

  public async removeUser(id: string) {
    const deletedUser = await this.user.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new UserNotFoundException(id);
    }
  }
}

export default userService;
