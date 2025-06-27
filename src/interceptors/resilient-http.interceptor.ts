import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import type { Reflector } from '@nestjs/core';
import type { ResilientHttpConfig } from '../types/hooks';
import { RESILIENT_HTTP_CONFIG } from '../decorators/resilient-http.decorator';

@Injectable()
export class ResilientHttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResilientHttpInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const resilientConfig =
      this.reflector.getAllAndOverride<ResilientHttpConfig>(
        RESILIENT_HTTP_CONFIG,
        [context.getHandler(), context.getClass()],
      );

    if (!resilientConfig) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    if (resilientConfig.enableLogging) {
      this.logger.log(
        `Resilient HTTP call started: ${request.method} ${request.url}`,
      );
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        if (resilientConfig.enableLogging) {
          this.logger.log(
            `Resilient HTTP call completed: ${request.method} ${request.url} (${duration}ms)`,
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        if (resilientConfig.enableLogging) {
          this.logger.error(
            `Resilient HTTP call failed: ${request.method} ${request.url} (${duration}ms)`,
            error.message,
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
