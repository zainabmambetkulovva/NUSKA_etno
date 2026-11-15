import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

/** Rate limits per real client IP (see clientIpMiddleware), not per proxy server. */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  /** Server-side rendering requests of the website itself are not rate limited. */
  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.switchToHttp().getRequest<Request>().fromTrustedServer) return true;
    return super.shouldSkip(context);
  }

  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as Request;
    return request.clientIp ?? request.ip ?? 'unknown';
  }
}
