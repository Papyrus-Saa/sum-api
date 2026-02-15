import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request as { requestId?: string }).requestId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message || 'HTTP Exception'
          : exception.message;
      details = (exceptionResponse as any).details;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Build response object, only including details if it exists
    const responseObj: any = {
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
