import { ResponseStatusCode } from "./response-status-code.dto";

export interface ResponseDTO<T>
{
    statusCode: ResponseStatusCode,
    data: T,
}