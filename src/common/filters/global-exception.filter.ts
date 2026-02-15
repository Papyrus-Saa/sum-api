import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface CustomHttpExceptionResponse {
  message?: string;
  details?: unknown;
}

interface ResponseObject {
  requestId?: string;
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as { requestId?: string }).requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        const customResponse = exceptionResponse as CustomHttpExceptionResponse;
        message = customResponse.message || 'HTTP Exception';
        details = customResponse.details;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Build response object, only including details if it exists
    const responseObj: ResponseObject = {
      requestId,
      error: {
        code: status,
        message,
      },
      timestamp: new Date().toISOString(),
      path: request.path,
    };

    // Only add details if it has a value
    if (details !== undefined) {
      responseObj.error.details = details;
    }

    response.status(status).json(responseObj);
  }
}
