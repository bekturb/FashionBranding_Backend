import { employeeModel } from "./employee.model";
import { NotFoundException } from "../exceptions/notfound.exception";
import { IEmployee } from "./employee.interface";
import { FileService } from "../s3/s3.service";

class EmployeeService {
  public employee = employeeModel;
  public fileService = new FileService();
  public;

  public async getEmployee(id: string) {
    const employee = await this.employee.findById(id);

    if (!employee) {
      throw new NotFoundException(`Сотрудник с ID #${id} не найден.`);
    }
    return { employee };
  }

  public async getEmployees() {
    const employees = await this.employee.find();
    return { employees };
  }

  public async createNewEmployee(
    employeeData: IEmployee,
    fileUrl: string
  ) {
    const employeeDataWithImage = {
      ...employeeData,
      image: fileUrl,
    };

    const employee = new this.employee(employeeDataWithImage);
    await employee.save();

    return { employee };
  }

  public async updateEmployeeSvc(
    id: string,
    userData: IEmployee,
    file: Express.Multer.File
  ) {
    const existingEmployee = await this.employee.findById(id);

    if (!existingEmployee) {
      throw new NotFoundException(`Сотрудник с ID #${id} не найден.`);
    }

    let updatedImageUrl = existingEmployee.image;
    if (file) {
      if (existingEmployee.image) {
        await this.fileService.deleteFile(existingEmployee.image);
      }

      updatedImageUrl = await this.fileService.uploadFile(file);
    }

    const updatedEmployee = await this.employee.findByIdAndUpdate(
      id,
      { ...userData, image: updatedImageUrl },
      { new: true, runValidators: true }
    );
    return { updatedEmployee };
  }

  public async deleteEmployeeSvc(id: string) {
    const deletedEmployee = await this.employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      throw new NotFoundException(`Сотрудник с ID #${id} не найден.`);
    }
    return { deletedEmployee };
  }
}

export default EmployeeService;
