import { NextFunction, Request, Response, Router } from "express";
import * as multer from "multer";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { CreateEmployeeDto } from "./employee.dto";
import { IEmployee } from "./employee.interface";
import EmployeeService from "./employee.service";
import { FileService } from "../s3/s3.service";
import { authMiddleware } from "../middleware/auth";

export class EmployeeController implements IController {
  public path: string = "/employee";
  public router: Router = Router();
  public employeeService = new EmployeeService();
  public fileService = new FileService();
  private upload: multer.Multer;

  constructor() {
    this.upload = multer({ storage: multer.memoryStorage() });
    this.initializeRoutes();
  }

  public initializeRoutes(): void {
    this.router.get(`${this.path}/:id`, authMiddleware, this.getEmployeeById);
    this.router.get(this.path, authMiddleware, this.getAllEmployees);
    this.router.post(
      this.path,
      authMiddleware,
      this.upload.single("image"),
      validationMiddleware(CreateEmployeeDto),
      this.createEmployee
    );
    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      this.upload.single("image"),
      validationMiddleware(CreateEmployeeDto),
      this.updateEmployee
    );
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteEmployee);
  }

  private getEmployeeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const { employee } = await this.employeeService.getEmployee(id);

      res.send(employee);
    } catch (err) {
      next(err);
    }
  };

  private getAllEmployees = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { employees } = await this.employeeService.getEmployees();
      res.send(employees);
    } catch (err) {
      next(err);
    }
  };

  private createEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employeeData: IEmployee = req.body;
      const file = req.file;
      let fileUrl;

      if (file) {
        fileUrl = await this.fileService.uploadFile(file);
      }

      try {
        const { employee } = await this.employeeService.createNewEmployee(
          employeeData,
          fileUrl
        );

        res.status(201).send(employee);
      } catch (employeeError) {
        if (fileUrl) {
          await this.fileService.deleteFile(fileUrl);
        }
        next(employeeError);
      }
    } catch (err) {
      next(err);
    }
  };

  private updateEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userData: IEmployee = req.body;
      const file: Express.Multer.File = req.file
      const { updatedEmployee } = await this.employeeService.updateEmployeeSvc(
        id,
        userData,
        file
      );
      res.send(updatedEmployee);
    } catch (err) {
      next(err);
    }
  };

  private deleteEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { deletedEmployee } = await this.employeeService.deleteEmployeeSvc(
        id
      );

      if (deletedEmployee.image) {
        await this.fileService.deleteFile(deletedEmployee.image);
      }

      res.status(204).send({ message: "Сотрудник успешно удален." });
    } catch (err) {
      next(err);
    }
  };
}
