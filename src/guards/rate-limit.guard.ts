/**
 * Rate limiting guard with request delaying and configurable windows
 *
 * @description Implements intelligent rate limiting that delays requests instead of rejecting them
 * when limits are exceeded. Supports configurable delays, burst allowances, and graceful
 * degradation to improve user experience while preventing abuse.
 *
 * @example
 * \`\`\`typescript
 * // Apply with delay strategy (recommended)
 * @Post('login')
 * @UseGuards(new RateLimitGuard({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 5, // 5 attempts per window
 *   delayAfter: 3, // Start delaying after 3 requests
 *   delayMs: 1000, // 1 second delay
 *   maxDelayMs: 10000, // Maximum 10 second delay
 *   strategy: 'delay'
 * }))
 * async login(@Body() credentials: LoginDto) {
 *   return this.authService.login(credentials);
 * }
 *
 * // Apply with rejection strategy (legacy behavior)
 * @Post('api-endpoint')
 * @UseGuards(new RateLimitGuard({
 *   windowMs: 60 * 1000, // 1 minute
 *   max: 100,
 *   strategy: 'reject',
 *   message: 'API rate limit exceeded'
 * }))
 * async apiEndpoint() {
 *   return this.apiService.getData();
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { RateLimitOptions } from '../types';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requests = new Map<
    string,
    { count: number; resetTime: number; lastRequest: number }
  >();

  /**
   * Initialize rate limit guard with enhanced configuration options
   *
   * @param options - Rate limiting configuration
   * @param options.windowMs - Time window in milliseconds (default: 15 minutes)
   * @param options.max - Maximum requests per window (default: 100)
   * @param options.strategy - Rate limiting strategy: 'delay' or 'reject' (default: 'delay')
   * @param options.delayAfter - Start delaying after this many requests (default: max * 0.8)
   * @param options.delayMs - Base delay in milliseconds (default: 1000)
   * @param options.maxDelayMs - Maximum delay in milliseconds (default: 30000)
   * @param options.delayMultiplier - Multiplier for progressive delays (default: 1.5)
   * @param options.message - Error message when using reject strategy
   *
   * @example
   * \`\`\`typescript
   * // Gentle rate limiting with progressive delays
   * const gentleRateLimit = new RateLimitGuard({
   *   windowMs: 5 * 60 * 1000, // 5 minutes
   *   max: 10, // 10 requests per 5 minutes
   *   strategy: 'delay',
   *   delayAfter: 7, // Start delaying after 7 requests
   *   delayMs: 500, // Start with 500ms delay
   *   maxDelayMs: 5000, // Maximum 5 second delay
   *   delayMultiplier: 2 // Double delay each time
   * });
   *
   * // Strict rate limiting for sensitive endpoints
   * const strictRateLimit = new RateLimitGuard({
   *   windowMs: 60 * 1000, // 1 minute
   *   max: 3, // 3 requests per minute
   *   strategy: 'delay',
   *   delayAfter: 1, // Start delaying after first request
   *   delayMs: 2000, // 2 second delay
   *   maxDelayMs: 15000 // Maximum 15 second delay
   * });
   *
   * // Legacy rejection behavior
   * const rejectRateLimit = new RateLimitGuard({
   *   windowMs: 15 * 60 * 1000,
   *   max: 100,
   *   strategy: 'reject',
   *   message: 'Too many requests. Please try again later.'
   * });
   * \`\`\`
   */
  constructor(
    private options: RateLimitOptions & {
      strategy?: 'delay' | 'reject';
      delayAfter?: number;
      delayMs?: number;
      maxDelayMs?: number;
      delayMultiplier?: number;
    } = {},
  ) {
    this.options = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      strategy: 'delay', // Default to delay strategy
      delayMs: 1000, // 1 second base delay
      maxDelayMs: 30000, // 30 second maximum delay
      delayMultiplier: 1.5, // Progressive delay multiplier
      message: 'Rate limit exceeded. Request delayed.',
      ...options,
    };

    // Set delayAfter to 80% of max if not specified
    if (!this.options.delayAfter) {
      this.options.delayAfter = Math.floor(this.options.max! * 0.8);
    }
  }

  /**
   * Check rate limits and apply delay or rejection strategy
   *
   * @description Tracks requests per client IP and applies configured rate limiting strategy.
   * With delay strategy, requests are delayed progressively. With reject strategy,
   * requests are rejected with HTTP 429 status.
   *
   * @param context - NestJS execution context containing request information
   * @returns Promise resolving to true if request should proceed
   *
   * @throws {HttpException} With status 429 when using reject strategy and limit exceeded
   *
   * @example
   * \`\`\`typescript
   * // Delay strategy behavior:
   * // Request 1-7: Immediate response
   * // Request 8: 1 second delay
   * // Request 9: 1.5 second delay
   * // Request 10: 2.25 second delay
   * // Request 11+: Capped at maxDelayMs
   *
   * // Reject strategy behavior:
   * // Request 1-100: Immediate response
   * // Request 101+: HTTP 429 error
   *
   * // Request tracking per IP:
   * // IP: 192.168.1.100 -> { count: 8, resetTime: 1703123456789, lastRequest: 1703123450000 }
   * \`\`\`
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = this.getKey(request);
    const now = Date.now();

    let record = this.requests.get(key);

    // Reset if window has expired
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + this.options.windowMs!,
        lastRequest: now,
      };
      this.requests.set(key, record);
      return true;
    }

    // Increment request count
    record.count++;
    record.lastRequest = now;

    // Apply rate limiting strategy
    if (this.options.strategy === 'reject') {
      return this.handleRejectStrategy(record);
    } else {
      return await this.handleDelayStrategy(record);
    }
  }

  /**
   * Handle reject strategy (legacy behavior)
   *
   * @description Immediately rejects requests that exceed the configured limit
   * by throwing an HTTP 429 exception.
   *
   * @param record - Current request tracking record for the client
   * @returns True if within limits, throws exception if exceeded
   *
   * @throws {HttpException} With status 429 when limit exceeded
   *
   * @private
   */
  private handleRejectStrategy(record: {
    count: number;
    resetTime: number;
    lastRequest: number;
  }): boolean {
    if (record.count > this.options.max!) {
      throw new HttpException(
        this.options.message,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  /**
   * Handle delay strategy with progressive delays
   *
   * @description Applies progressive delays to requests that exceed the delayAfter threshold.
   * Delays increase exponentially up to the maximum configured delay.
   *
   * @param record - Current request tracking record for the client
   * @returns Promise resolving to true after applying appropriate delay
   *
   * @private
   *
   * @example
   * \`\`\`typescript
   * // Example delay calculation:
   * // delayAfter: 5, delayMs: 1000, delayMultiplier: 1.5
   * // Request 6: 1000ms delay
   * // Request 7: 1500ms delay
   * // Request 8: 2250ms delay
   * // Request 9: 3375ms delay
   * // Request 10+: Capped at maxDelayMs
   * \`\`\`
   */
  private async handleDelayStrategy(record: {
    count: number;
    resetTime: number;
    lastRequest: number;
  }): Promise<boolean> {
    // No delay needed if under threshold
    if (record.count <= this.options.delayAfter!) {
      return true;
    }

    // Calculate progressive delay
    const excessRequests = record.count - this.options.delayAfter!;
    const baseDelay = this.options.delayMs!;
    const multiplier = this.options.delayMultiplier!;

    // Progressive delay: baseDelay * (multiplier ^ excessRequests)
    let delay = baseDelay * Math.pow(multiplier, excessRequests - 1);

    // Cap at maximum delay
    delay = Math.min(delay, this.options.maxDelayMs!);

    // Apply jitter to prevent thundering herd (±10%)
    const jitter = delay * 0.1 * (Math.random() - 0.5);
    delay = Math.max(0, delay + jitter);

    // Log delay for monitoring (optional)
    if (this.options.enableLogging) {
      console.log(
        `Rate limit delay applied: ${Math.round(delay)}ms for ${this.getKey(record as any)}`,
      );
    }

    // Apply the delay
    await this.sleep(delay);

    return true;
  }

  /**
   * Sleep for specified duration
   *
   * @description Utility method to create a delay using Promise-based timeout.
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the specified delay
   *
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract client identifier for rate limiting
   *
   * @description Generates a unique key for each client, typically based on IP address.
   * Falls back to connection information if IP is not available.
   *
   * @param request - HTTP request object
   * @returns Unique identifier string for the client
   *
   * @private
   *
   * @example
   * \`\`\`typescript
   * // Typical key generation:
   * // Direct IP: "192.168.1.100"
   * // Proxied IP: "203.0.113.1"
   * // Fallback: "unknown" (when IP cannot be determined)
   * \`\`\`
   */
  private getKey(request: any): string {
    return request.ip || request.connection.remoteAddress || 'unknown';
  }

  /**
   * Get current rate limit status for a client
   *
   * @description Utility method to check the current rate limit status for debugging
   * or monitoring purposes. Returns information about request count, remaining requests,
   * and reset time.
   *
   * @param request - HTTP request object to check status for
   * @returns Rate limit status information
   *
   * @example
   * \`\`\`typescript
   * // Usage in controller for debugging
   * @Get('rate-limit-status')
   * async getRateLimitStatus(@Req() request: Request) {
   *   const rateLimitGuard = new RateLimitGuard();
   *   return rateLimitGuard.getStatus(request);
   * }
   *
   * // Example response:
   * // {
   * //   requests: 7,
   * //   remaining: 3,
   * //   resetTime: 1703123456789,
   * //   resetIn: 45000,
   * //   strategy: 'delay',
   * //   willDelay: false
   * // }
   * \`\`\`
   */
  getStatus(request: any): {
    requests: number;
    remaining: number;
    resetTime: number;
    resetIn: number;
    strategy: string;
    willDelay: boolean;
  } {
    const key = this.getKey(request);
    const record = this.requests.get(key);
    const now = Date.now();

    if (!record || now > record.resetTime) {
      return {
        requests: 0,
        remaining: this.options.max!,
        resetTime: now + this.options.windowMs!,
        resetIn: this.options.windowMs!,
        strategy: this.options.strategy!,
        willDelay: false,
      };
    }

    const remaining = Math.max(0, this.options.max! - record.count);
    const willDelay =
      this.options.strategy === 'delay' &&
      record.count > this.options.delayAfter!;

    return {
      requests: record.count,
      remaining,
      resetTime: record.resetTime,
      resetIn: record.resetTime - now,
      strategy: this.options.strategy!,
      willDelay,
    };
  }
}
