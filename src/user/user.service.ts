import { UserNotFoundException } from "../exceptions/userNotFound.exception";
import { userModel } from "./user.model";
import { IUser } from "./user.interface";
import { FileService } from "../s3/s3.service";
import { NotFoundException } from "../exceptions/notfound.exception";

class userService {
  public user = userModel;
  public fileService = new FileService();
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

  public async updateUserProfile(
    id: string, 
    userData: IUser, 
    file: Express.Multer.File
  ) {
    const existingUser = await this.user.findById(id);
    
        if (!existingUser) {
          throw new NotFoundException(`Пользователь с ID #${id} не найден.`);
        }
    
        let updatedImageUrl = existingUser.image;
        if (file) {
          if (existingUser.image) {
            await this.fileService.deleteFile(existingUser.image);
          }
    
          updatedImageUrl = await this.fileService.uploadFile(file);
        }
    
        const updatedUser = await this.user.findByIdAndUpdate(
          id,
          { ...userData, image: updatedImageUrl },
          { new: true, runValidators: true }
        );
        return { updatedUser };
  }

  public async removeUser(id: string) {
    const deletedUser = await this.user.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new UserNotFoundException(id);
    }

    return {deletedUser}
  }
}

export default userService;
