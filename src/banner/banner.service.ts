import { bannerModel } from "./banner.model";
import { BannerNotFoundException } from "../exceptions/bannerNotFound.exception";
import { IBanner } from "./banner.inteface";
import { NotFoundException } from "../exceptions/notfound.exception";
import { FileService } from "../s3/s3.service";

class BannerService {
  public banner = bannerModel;
  public fileService = new FileService();
  public;

  public async getBanner(id: string) {
    const doc = await this.banner.findById(id).lean();

    if (!doc) throw new BannerNotFoundException();

    const { __v, ...cleanBanner } = doc;
    return { cleanBanner };
  }

  public async getBanners() {
    const banners = await this.banner.find().lean();
    const cleanedBanners = banners.map(({ __v, ...banner }) => banner);
    return { cleanedBanners };
  }

  public async createNewBanner(
    bannerData: IBanner,
    leftFileUrls: string[],
    rightFileUrls: string[]
  ) {
    const bannerDataWithImages = {
      ...bannerData,
      leftImages: leftFileUrls,
      rightImage: rightFileUrls[0],
    };
    const newBanner = new bannerModel(bannerDataWithImages);
    await newBanner.save();
    return { newBanner };
  }

  public async updateBanner(
    id: string,
    bannerData: IBanner,
    leftImages: Express.Multer.File[],
    rightImages: Express.Multer.File[]
  ) {
    const existingBanner = await this.banner.findById(id).lean();
    if (!existingBanner) {
      throw new NotFoundException(`Баннер не найден!`);
    }

    if (existingBanner.leftImages?.length) {
      await this.fileService.deleteMultipleFiles(existingBanner.leftImages);
    }
    if (existingBanner.rightImage) {
      await this.fileService.deleteFile(existingBanner.rightImage);
    }

    const leftImageUrls = await this.fileService.uploadMultipleFiles(leftImages);
    const rightImageUrl = await this.fileService.uploadMultipleFiles(rightImages);

    const updatedBanner = await this.banner.findByIdAndUpdate(
      id,
      {
        ...bannerData,
        leftImages: leftImageUrls,
        rightImage: rightImageUrl[0],
      },
      { new: true, runValidators: true }
    );
  
    return { updatedBanner };
  }
}

export default BannerService;
