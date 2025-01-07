import Request from "../request/enum/request.enum";

export interface IRequestsQuery {
    page?: string;
    limit?: string;
    search?: string;
    startDate?: string,
    endDate?: string,
    category?: string,
    type?: Request
  }