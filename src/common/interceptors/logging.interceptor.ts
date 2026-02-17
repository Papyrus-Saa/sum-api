import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId = (request as Request & { requestId?: string }).requestId;

    const { method, originalUrl, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log({
      type: 'request',
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (): void => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          this.logger.log({
            type: 'response',
            requestId,
            method,
            url: originalUrl,
            statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          });
        },
        error: (error: Error): void => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log error response
          this.logger.error({
            type: 'response_error',
            requestId,
            method,
            url: originalUrl,
            statusCode,
            duration: `${duration}ms`,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
