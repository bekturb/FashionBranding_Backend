import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Router, Request, Response, NextFunction } from 'express';
import { IController } from '../interfaces/controller.interface';
import * as multer from 'multer';

export class FileController implements IController {
  public path: string = '/file';
  public router: Router = Router();
  private s3Client: S3Client;
  private upload: multer.Multer;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION as string,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME as string;

    this.upload = multer({ storage: multer.memoryStorage() });

    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(this.path, this.upload.single('file'), this.uploadFile);
    /**
     * @swagger
     * /file:
     *   post:
     *     summary: Upload a file to AWS S3
     *     description: This endpoint uploads a file to the specified AWS S3 bucket and returns the file URL.
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: File uploaded successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 link:
     *                   type: string
     *                   description: The URL of the uploaded file
     *                   example: 'https://your-bucket.s3.amazonaws.com/filename'
     *       400:
     *         description: File not found in the request
     *       500:
     *         description: Internal server error
     */
  }

  private uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ message: 'Файл не найден' });
      }

      const key = encodeURIComponent(file.originalname);
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      res.status(200).json({ link: fileUrl });
    } catch (error) {
      console.error('Ошибка загрузки файла в S3:', error);
      next(error);
    }
  };
}