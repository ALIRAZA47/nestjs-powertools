/**
 * Response transformation interceptor with standardized formatting.
 *
 * @class
 * @template T
 * @description Automatically wraps all controller responses in a standardized format with success indicators, timestamps, and consistent structure. Ensures API responses follow a uniform pattern across the application.
 * @example
 * // Apply globally to standardize all responses
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: TransformInterceptor,
 *     }
 *   ]
 * })
 * export class AppModule {}
 *
 * // Before transformation:
 * @Get('user')
 * async getUser() {
 *   return { id: 1, name: 'John' };
 * }
 *
 * // After transformation:
 * // {
 * //   success: true,
 * //   data: { id: 1, name: 'John' },
 * //   timestamp: '2024-01-15T10:30:45.123Z'
 * // }
 * @since 1.0.0
 */
import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  /**
   * Transform controller responses into standardized format.
   *
   * @method
   * @param {ExecutionContext} context - NestJS execution context (not used in this implementation).
   * @param {CallHandler} next - Call handler for the next interceptor or route handler.
   * @returns {Observable<Response<T>>} Observable that emits the transformed response.
   * @description Wraps the original response data in a consistent structure with success indicators and timestamps. Does not modify the original data, only adds metadata around it.
   * @example
   * // Original controller response:
   * // return { message: 'Hello World' };
   * // Transformed response:
   * // {
   * //   success: true,
   * //   data: { message: 'Hello World' },
   * //   timestamp: '2024-01-15T10:30:45.123Z'
   * // }
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
