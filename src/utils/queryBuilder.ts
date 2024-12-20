import { FilterQuery } from "mongoose";
import { IRequest } from "../request/request.interface";
import { IRequestsQuery } from "../interfaces/requestsQuery.interface";

export class QueryBuilder {
  private page: number;
  private limit: number;
  private skip: number;
  private search: string;
  private startDate?: Date;
  private endDate?: Date;
  private type?: string;
  private filterQuery: FilterQuery<IRequest> = {};

  constructor(query: IRequestsQuery) {
    this.page = Math.max(parseInt(query.page || "1", 10), 1);
    this.limit = Math.max(parseInt(query.limit || "10", 10), 1);
    this.skip = (this.page - 1) * this.limit;
    this.search = query.search?.trim() || "";
    this.startDate = query.startDate ? new Date(query.startDate) : undefined;
    this.endDate = query.endDate ? new Date(query.endDate) : undefined;
    this.type = query.type;

    this.buildFilters();
  }

  private buildFilters() {
    if (this.search) {
      this.filterQuery.$or = [
        { name: { $regex: this.search, $options: "i" } },
        { phoneNumber: { $regex: this.search, $options: "i" } },
        { textileName: { $regex: this.search, $options: "i" } }
      ];
    }

    if (
      this.startDate &&
      !isNaN(this.startDate.getTime()) &&
      this.endDate &&
      !isNaN(this.endDate.getTime())
    ) {
      this.filterQuery.createdAt = {
        $gte: this.startDate,
        $lte: new Date(this.endDate.setHours(23, 59, 59, 999)),
      };
    } else if (this.startDate && !isNaN(this.startDate.getTime())) {
      this.filterQuery.createdAt = { $gte: this.startDate };
    } else if (this.endDate && !isNaN(this.endDate.getTime())) {
      this.filterQuery.createdAt = {
        $lte: new Date(this.endDate.setHours(23, 59, 59, 999)),
      };
    }

    if (this.type) {
      this.filterQuery.type = this.type;
    }
  }

  public getPage() {
    return this.page;
  }

  public getLimit() {
    return this.limit;
  }

  public getSkip() {
    return this.skip;
  }

  public getFilters() {
    return this.filterQuery;
  }
}