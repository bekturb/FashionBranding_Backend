import { NextFunction, Request, Response, Router } from "express";
import { IController } from "../interfaces/controller.interface";
import { validationMiddleware } from "../middleware/validation.middleware";
import { employeeModel } from "./employee.model";
import { CreateEmployeeDto } from "./employee.dto";
import { NotFoundException } from "../exceptions/notfound.exception";
import { IEmployee } from "./employee.interface";

export class EmployeeController implements IController {
  public path: string = "/employee";
  public router: Router = Router();
  private employee = employeeModel;

  constructor() {
    this.initializeRoutes();
  }
  
  public initializeRoutes() {
    this.router.get(`${this.path}/:id`, this.getEmployeeById);
    this.router.get(this.path, this.getAllEmployees);
    this.router.post(this.path, validationMiddleware(CreateEmployeeDto), this.createEmployee)
    this.router.patch(
      `${this.path}/:id`,
      validationMiddleware(CreateEmployeeDto),
      this.updateEmployee
    );
    this.router.delete(`${this.path}/:id`, this.deleteEmployee);
  }

   /**
     * @swagger
     * /employee/{id}:
     *   get:
     *     summary: Get employee by ID
     *     tags:
     *       - Employees
     *     description: Retrieve a employee's details by their unique ID.
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: The unique identifier of the employee.
     *         schema:
     *           type: string
     *           example: 64b2f0c7e11a4e6d8b16a8e2
     *     responses:
     *       200:
     *         description: A employee's details.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: string
     *                   description: The unique identifier of the employee.
     *                 username:
     *                   type: string
     *                   example: Bektursun
     *                   description: The name of the employee.
     *                 image:
     *                   type: string
     *                   example: https://cdn.example.com/images/photo.jpg
     *                   description: The email address of the employee.
     *                 position:
     *                   type: string
     *                   example: Head Offactory
     *                   description: The position of the employee.
     *       404:
     *         description: Employee not found.
     */

  private getEmployeeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const employee = await this.employee.findById(id);

      if (!employee) {
        return next(new NotFoundException(`employee #${id} not found`));
      }

      res.send(employee);
    } catch (err) {
      next(err);
    }
  };

    /**
 * @swagger
 * /employee:
 *   get:
 *     summary: Get all employees
 *     tags:
 *       - Employees
 *     description: Retrieve a list of all employees.
 *     responses:
 *       200:
 *         description: A list of employees.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The unique identifier of the user.
 *                   username:
 *                     type: string
 *                     example: Bektursun
 *                     description: The name of the user.
 *                   image:
 *                     type: string
 *                     example: https://cdn.example.com/images/photo.jpg
 *                     description: The email address of the employee.
 *                   position:
 *                     type: string
 *                     example: Head Offactory
 *                     description: The position of the employee.
 */

  private getAllEmployees = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employees = await this.employee.find();
      res.send(employees);
    } catch (err) {
      next(err);
    }
  };

  /**
 * @swagger
 * /employee:
 *   post:
 *     summary: Create a new employee
 *     tags:
 *       - Employees
 *     description: Create a new employee by providing necessary details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: Bektursun
 *                 description: The name of the employee.
 *               position:
 *                 type: string
 *                 example: Head of factory
 *                 description: The position for the employee.
 *               image:
 *                 type: string
 *                 example: https://cdn.example.com/images/photo.jpg
 *                 description: The profile image URL of the employee.
 *     responses:
 *       201:
 *         description: Employee created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique ID of the newly created employee.
 *                 username:
 *                   type: string
 *                   example: Bektursun
 *                   description: The name of the employee.
 *                 position:
 *                   type: string
 *                   example: Head of factory
 *                   description: The position of the employee.
 *                 image:
 *                   type: string
 *                   example: https://cdn.example.com/images/photo.jpg
 *                   description: The profile image URL of the employee.
 *       400:
 *         description: Invalid input or missing parameters.
 */

  private createEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employeeData: CreateEmployeeDto = req.body;

      const employee = new this.employee(employeeData);
      await employee.save();

      res.status(201).send(employee);
    } catch (err) {
      next(err);
    }
  };

/**
 * @swagger
 * /employee/{id}:
 *   patch:
 *     summary: Update a employee's details
 *     tags:
 *       - Employees
 *     description: Update a employee's profile information such as username and image.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the employee to update.
 *         schema:
 *           type: string
 *           example: 64b2f0c7e11a4e6d8b16a8e2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: Bektursun
 *                 description: The name of the employee.
 *               position:
 *                 type: string
 *                 example: Design lead
 *                 description: The image URL of the employee.
 *               image:
 *                 type: string
 *                 example: https://cdn.example.com/images/photo.jpg
 *                 description: The image URL of the employee.
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique ID of the employee.
 *                 username:
 *                   type: string
 *                   example: Bektursun
 *                   description: The updated name of the employee.
 *                 position:
 *                   type: string
 *                   example: Head of factory
 *                   description: The position of the employee.
 *                 image:
 *                   type: string
 *                   example: https://cdn.example.com/images/photo.jpg
 *                   description: The updated image URL of the employee.
 *       400:
 *         description: Invalid input or missing parameters.
 *       404:
 *         description: Employee not found.
 */


  private updateEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const userData: IEmployee = req.body;

      const updatedEmployee = await this.employee.findByIdAndUpdate(id, userData, {
        new: true,
      });

      if (!updatedEmployee) {
        return next(new NotFoundException(`employee #${id} not found`));
      }
      res.send(updatedEmployee);
    } catch (err) {
      next(err);
    }
  };
  
 /**
 * @swagger
 * /employee/{id}:
 *   delete:
 *     summary: Delete a employee
 *     tags:
 *       - Employees
 *     description: Deletes a employee by their unique ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The unique identifier of the employee to delete.
 *         schema:
 *           type: string
 *           example: 64b2f0c7e11a4e6d8b16a8e2
 *     responses:
 *       200:
 *         description: Employee deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Employee deleted successfully.
 *       404:
 *         description: Employee not found.
 *       500:
 *         description: Internal server error.
 */

  private deleteEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const deletedEmployee = await this.employee.findByIdAndDelete(id);
      if (!deletedEmployee) {
        return next(new NotFoundException(`employee #${id} not found`));
      }
      res.status(204).send({message: "Employee succesfully deleted"});
    } catch (err) {
      next(err);
    }
  };
}
