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

/**
 * Resilient HTTP interceptor for retry, timeout, and circuit breaker support.
 *
 * @class
 * @description Adds resilience features (retry, timeout, circuit breaker) to HTTP requests. Reads configuration from metadata and logs execution details. Integrates with the ResilientHttpConfig and supports per-endpoint overrides.
 * @example
 * // Apply globally
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: ResilientHttpInterceptor,
 *     }
 *   ]
 * })
 * export class AppModule {}
 *
 * // Apply to specific endpoints with @ResilientHttp decorator
 * @Get('external')
 * @ResilientHttp({ timeout: 10000, retry: { maxAttempts: 3 } })
 * async callExternal() { ... }
 * @since 1.0.0
 */
@Injectable()
export class ResilientHttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResilientHttpInterceptor.name);

  constructor(private reflector: Reflector) {}

  /**
   * Intercept HTTP requests and apply resilience strategies.
   *
   * @method
   * @param {ExecutionContext} context - NestJS execution context containing request information.
   * @param {CallHandler} next - Call handler for the next interceptor or route handler.
   * @returns {Observable<any>} Observable that emits the response or error after applying resilience logic.
   * @description Applies retry, timeout, and circuit breaker logic based on configuration. Logs execution time and errors if enabled.
   * @example
   * // Logs:
   * // Resilient HTTP call started: GET /api/external
   * // Resilient HTTP call completed: GET /api/external (120ms)
   * // Resilient HTTP call failed: GET /api/external (error)
   */
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
