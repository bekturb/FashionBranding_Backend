import mongoose from "mongoose";
import { employeeModel } from "./employee.model";
import { NotFoundException } from "../exceptions/notfound.exception";
import { CreateEmployeeDto } from "./employee.dto";

class EmployeeService {
  public employee = employeeModel;
  private mongoose = mongoose;
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

    return { employee }
  }
}

export default EmployeeService;
