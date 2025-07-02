/**
 * In-memory caching interceptor with TTL support.
 *
 * @class
 * @description Provides automatic response caching to improve performance by storing and reusing responses for identical requests. Supports configurable TTL (time-to-live) and custom cache keys for fine-grained control.
 * @example
 * // Apply with default settings (5 minute TTL)
 * @Get('expensive-operation')
 * @UseInterceptors(CacheInterceptor)
 * async expensiveOperation() {
 *   // This response will be cached for 5 minutes
 *   return await this.performExpensiveCalculation();
 * }
 *
 * // Apply with custom TTL
 * @Get('frequently-accessed')
 * @UseInterceptors(new CacheInterceptor({ ttl: 60000 })) // 1 minute
 * async getFrequentData() {
 *   return this.dataService.getPopularContent();
 * }
 *
 * // Apply with custom cache key
 * @Get('user-specific/:id')
 * @UseInterceptors(new CacheInterceptor({ key: 'user-data', ttl: 300000 }))
 * async getUserData(@Param('id') id: string) {
 *   return this.userService.getComplexUserData(id);
 * }
 * @since 1.0.0
 */
import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { type Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { CacheOptions } from '../types';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, { data: any; expiry: number }>();

  /**
   * Initialize cache interceptor with configuration options.
   *
   * @constructor
   * @param {CacheOptions} [options] - Caching configuration.
   * @param {number} [options.ttl] - Time-to-live in milliseconds (default: 5 minutes).
   * @param {string} [options.key] - Custom cache key (default: auto-generated from request).
   * @example
   * // Default configuration
   * const defaultCache = new CacheInterceptor();
   * // Custom TTL for short-lived data
   * const shortCache = new CacheInterceptor({ ttl: 30000 }); // 30 seconds
   * // Custom key for grouped caching
   * const groupedCache = new CacheInterceptor({ key: 'product-catalog', ttl: 600000 });
   */
  constructor(private options: CacheOptions = {}) {
    this.options = {
      ttl: 300000, // 5 minutes default
      ...options,
    };
  }

  /**
   * Intercept requests to provide caching functionality.
   *
   * @method
   * @param {ExecutionContext} context - NestJS execution context containing request information.
   * @param {CallHandler} next - Call handler for the next interceptor or route handler.
   * @returns {Observable<any>} Observable that emits cached or fresh response data.
   * @description Checks cache for existing responses before executing the handler. If a valid cached response exists, returns it immediately. Otherwise, executes the handler and caches the result for future requests.
   * @example
   * // Cache hit scenario:
   * // 1. Request comes in for GET /api/data
   * // 2. Cache key "GET:/api/data" found with valid expiry
   * // 3. Cached response returned immediately (no handler execution)
   *
   * // Cache miss scenario:
   * // 1. Request comes in for GET /api/data
   * // 2. No cache entry or expired entry found
   * // 3. Handler executes and generates response
   * // 4. Response cached with TTL for future requests
   * // 5. Response returned to client
   *
   * // Cache key generation:
   * // Default: "GET:/api/users" (method + URL)
   * // Custom: "user-data" (from options.key)
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = this.options.key || `${request.method}:${request.url}`;

    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((data) => {
        this.cache.set(key, {
          data,
          expiry: Date.now() + this.options.ttl!,
        });
      }),
    );
  }
}
