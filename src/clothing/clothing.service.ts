import { PipelineStage } from "mongoose";
import { clothingModel } from "./clothing.model";
import { ClothingNotFoundException } from "../exceptions/clothingNotFound.exception";
import { QueryBuilder } from "../utils/queryBuilder";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";
import { IClothing } from "./clothing.interface";
import EmailService from "../utils/email.service";
import { newsletterModel } from "../newsletter/newsletter.module";
import { NotFoundException } from "../exceptions/notfound.exception";
import { FileService } from "../s3/s3.service";

class ClothingService {
  public clothing = clothingModel;
  public newsletter = newsletterModel;
  public emailService = new EmailService();
  public fileService = new FileService();

  public;

  public async getCollection(id: string) {
    const clothing = await this.clothing.findById(id);

    if (!clothing) {
      throw new ClothingNotFoundException(id);
    }

    return { clothing };
  }

  public async getCollections(requestQueries: IRequestsQuery) {
    const queryBuilder = new QueryBuilder(requestQueries);

    const skip = queryBuilder.getSkip();
    const limit = queryBuilder.getLimit();
    const filters = queryBuilder.getFilters();
    const page = queryBuilder.getPage();

    const [clothings, total] = await Promise.all([
      this.clothing.find(filters).skip(skip).limit(limit),
      this.clothing.countDocuments(filters),
    ]);

    return { clothings, total, page, limit };
  }

  public async getCollectionsByChart() {
    const currentDate = new Date();
    const last9Months = [];

    for (let i = 8; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      last9Months.push(date.toISOString().slice(0, 7));
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(currentDate.getMonth() - 9)),
          },
        },
      },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        },
      },
      {
        $group: {
          _id: "$month",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const result = await this.clothing.aggregate(pipeline);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const data = last9Months.map((month) => {
      const monthData = result.find((entry) => entry._id === month);
      const monthIndex = parseInt(month.slice(5, 7), 10) - 1;
      return {
        name: monthNames[monthIndex],
        pv: monthData ? monthData.count * 10 : 0,
        amt: monthData ? monthData.count : 0,
        uv: monthData ? monthData.count : 0,
      };
    });

    return { data };
  }

  public async getTodaysCollections() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          createdAt: {
            $gte: yesterday,
            $lt: tomorrow,
          },
        },
      },
      {
        $project: {
          day: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
      {
        $group: {
          _id: "$day",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const result = await this.clothing.aggregate(pipeline);

    const todayData =
      result.find((entry) => entry._id === today.toISOString().slice(0, 10))
        ?.count || 0;
    const yesterdayData =
      result.find((entry) => entry._id === yesterday.toISOString().slice(0, 10))
        ?.count || 0;

    let percentageChange = 0;
    if (yesterdayData > 0) {
      percentageChange = ((todayData - yesterdayData) / yesterdayData) * 100;
    } else if (todayData > 0) {
      percentageChange = 100;
    }

    return { todayData, yesterdayData, percentageChange };
  }

  public async createNewCollection(
    clothingData: IClothing,
    fileUrl: string
  ) {
    const clothingDataWithImage = {
      ...clothingData,
      image: fileUrl,
    };
    const newClothing = new this.clothing(clothingDataWithImage);
    await newClothing.save();

    const subscribers = await this.newsletter.find({});
    if (subscribers.length > 0) {
      const emailList = subscribers.map((subscribe) => subscribe.email);
      await this.emailService.sendNewsletter(
        emailList,
        clothingData.name as string
      );
    }

    return { newClothing };
  }

  public async updateCollection(
    id: string,
    collectionData: IClothing,
    file: Express.Multer.File
  ) {
    const existingClothing = await this.clothing.findById(id);

    if (!existingClothing) {
      throw new NotFoundException(`Коллекция с ID #${id} не найдена.`);
    }

    let updatedImageUrl = existingClothing.image;
    if (file) {
      if (existingClothing.image) {
        await this.fileService.deleteFile(existingClothing.image);
      }

      updatedImageUrl = await this.fileService.uploadFile(file);
    }
    const updatedClothing = await this.clothing.findByIdAndUpdate(
      id,
      { ...collectionData, image: updatedImageUrl },
      { new: true, runValidators: true }
    );

    return { updatedClothing };
  }

  public async deleteCollection(id: string) {
    const deletedClothing = await this.clothing.findByIdAndDelete(id);

    if (!deletedClothing) {
      throw new ClothingNotFoundException(id);
    }

    return { deletedClothing };
  }
}

export default ClothingService;
