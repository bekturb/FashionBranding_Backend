import { employeeModel } from "./employee.model";
import { NotFoundException } from "../exceptions/notfound.exception";
import { CreateEmployeeDto } from "./employee.dto";
import { IEmployee } from "./employee.interface";

class EmployeeService {
  public employee = employeeModel;
  public;

  public async getEmployee(id: string) {
    const employee = await this.employee.findById(id);

    if (!employee) {
      throw new NotFoundException(`employee #${id} not found`);
    }
    return { employee };
  }

  public async getEmployees() {
    const employees = await this.employee.find();
    return { employees };
  }

  public async createNewEmployee(employeeData: CreateEmployeeDto) {
    const employee = new this.employee(employeeData);
    await employee.save();

    return { employee };
  }

  public async updateEmployeeSvc(id: string, userData: IEmployee) {
    const updatedEmployee = await this.employee.findByIdAndUpdate(id, userData, { new: true });

    if (!updatedEmployee) {
      throw new NotFoundException(`employee #${id} not found`);
    }
    return { updatedEmployee };
  }

  public async deleteEmployeeSvc(id: string) {
    const deletedEmployee = await this.employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      throw new NotFoundException(`employee #${id} not found`);
    }
    return { deletedEmployee };
  }
}

export default EmployeeService;
