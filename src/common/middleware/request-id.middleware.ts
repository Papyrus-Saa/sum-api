import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware to add a unique request ID to each request
 * Sets x-request-id header in response and requestId property in request object
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  const reqWithId = req as unknown as Record<string, unknown>;
  reqWithId.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
