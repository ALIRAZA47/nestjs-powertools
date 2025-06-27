import {
  Injectable,
  Logger,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Request/response logging interceptor with performance tracking
 *
 * @description Automatically logs HTTP requests and responses with execution timing.
 * Provides detailed logging for debugging, monitoring, and performance analysis.
 * Integrates with NestJS logging system for consistent log formatting.
 *
 * @example
 * \`\`\`typescript
 * // Apply globally to all routes
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: LoggingInterceptor,
 *     }
 *   ]
 * })
 * export class AppModule {}
 *
 * // Apply to specific controllers
 * @Controller('users')
 * @UseInterceptors(LoggingInterceptor)
 * export class UserController {
 *   // All methods will be logged
 * }
 *
 * // Apply to specific methods
 * @Get(':id')
 * @UseInterceptors(LoggingInterceptor)
 * async getUser(@Param('id') id: string) {
 *   return this.userService.findById(id);
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  /**
   * Intercept requests to provide comprehensive logging
   *
   * @description Logs request start, measures execution time, and logs completion
   * with performance metrics. Provides valuable insights for debugging and monitoring.
   *
   * @param context - NestJS execution context containing request information
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable that emits the response with logging side effects
   *
   * @example
   * \`\`\`typescript
   * // Example log output:
   * // [LoggingInterceptor] GET /api/users/123 - Start
   * // [LoggingInterceptor] GET /api/users/123 - 45ms
   *
   * // For error cases:
   * // [LoggingInterceptor] POST /api/users - Start
   * // [LoggingInterceptor] POST /api/users - Error after 120ms
   * \`\`\`
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    this.logger.log(`${method} ${url} - Start`);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(`${method} ${url} - ${duration}ms`);
      }),
    );
  }
}
