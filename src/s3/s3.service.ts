import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import * as crypto from "crypto";
import { NotFoundException } from "../exceptions/notfound.exception";

export class FileService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.validateEnvironmentVariables();

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME!;
  }

  private validateEnvironmentVariables(): void {
    const requiredVars = [
      "AWS_REGION",
      "AWS_ACCESS_KEY_ID",
      "AWS_SECRET_ACCESS_KEY",
      "AWS_S3_BUCKET_NAME",
    ];
    requiredVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        throw new Error(`Переменная окружения ${envVar} не установлена.`);
      }
    });
  }

  public async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new NotFoundException(
        "Файл не был загружен. Пожалуйста, прикрепите файл к запросу."
      );
    }

    const uniqueKey =
      crypto.randomBytes(16).toString("hex") + `_${file.originalname}`;

    const params = {
      Bucket: this.bucketName,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await this.s3Client.send(command);

    const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
    return fileUrl;
  }

  public async uploadMultipleFiles(
    files: Express.Multer.File[]
  ): Promise<string[]> {
    if (!files || files.length === 0) {
      throw new NotFoundException(
        "Файл не был загружен. Пожалуйста, прикрепите файл к запросу!"
      );
    }

    const fileUrls: string[] = [];

    for (const file of files) {
      const uniqueKey =
        crypto.randomBytes(16).toString("hex") + `_${file.originalname}`;
      const params = {
        Bucket: this.bucketName,
        Key: uniqueKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;
      fileUrls.push(fileUrl);
    }

    return fileUrls;
  }

  public async deleteFile(fileUrl: string): Promise<void> {
    const uniqueKey = fileUrl.split("/").pop();

    if (!uniqueKey) {
      throw new NotFoundException(
        "Неверный URL файла. Не удалось извлечь ключ файла."
      );
    }

    const params = {
      Bucket: this.bucketName,
      Key: uniqueKey,
    };

    const command = new DeleteObjectCommand(params);
    await this.s3Client.send(command);
  }

  public async deleteMultipleFiles(files: string[]): Promise<void> {

    if (!files || files.length === 0) {
      throw new NotFoundException(
        "Файл не был загружен. Пожалуйста, прикрепите файл к запросу!"
      );
    }

    const objectsToDelete = files.map((file) => {
      const key = file.split("/").pop();
      if (!key) {
        throw new NotFoundException( "Неверный URL файла. Не удалось извлечь ключ файла.");
      }
      return { Key: key };
    });

    const params: {
      Bucket: string;
      Delete: {
          Objects: {
              Key: string;
          }[];
          Quiet: boolean;
      };
  } = {
      Bucket: this.bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    };

    const command = new DeleteObjectsCommand(params);
    await this.s3Client.send(command);
  }
}
