import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';

/**
 * JWT authentication guard with public endpoint support.
 *
 * Extends Passport's JWT authentication guard to support public endpoints
 * that can be marked with the `@Public()` decorator. Provides flexible authentication
 * that can be bypassed for specific routes while maintaining security for others.
 *
 * @example
 * ```typescript
 * // Apply globally with public endpoint exceptions
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: JwtAuthGuard,
 *     },
 *   ],
 * })
 * export class AppModule {}
 *
 * @Controller('api')
 * export class ApiController {
 *   @Get('public-info')
 *   @Public() // Bypasses JWT authentication
 *   async getPublicInfo() {
 *     return { message: 'This is public' };
 *   }
 *
 *   @Get('private-info')
 *   async getPrivateInfo() {
 *     // Requires valid JWT token
 *     return { message: 'This is private' };
 *   }
 * }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determine if the route can be activated based on JWT authentication
   *
   * @description Checks if the route is marked as public before applying JWT validation.
   * Public routes bypass authentication entirely, while protected routes require
   * valid JWT tokens.
   *
   * @param context - NestJS execution context containing request information
   * @returns Promise or boolean indicating if access should be granted
   *
   * @example
   * \`\`\`typescript
   * // Public endpoint - no token required
   * @Get('health')
   * @Public()
   * async healthCheck() {
   *   return { status: 'ok' };
   * }
   *
   * // Protected endpoint - JWT token required
   * @Get('profile')
   * async getProfile(@CurrentUser() user: User) {
   *   return user;
   * }
   * \`\`\`
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Handle the authentication request result
   *
   * @description Processes the result of JWT validation and handles authentication
   * errors. Throws appropriate exceptions for invalid or missing tokens.
   *
   * @param err - Any error that occurred during authentication
   * @param user - The authenticated user object (if successful)
   * @param info - Additional information about the authentication attempt
   * @returns The authenticated user object
   *
   * @throws {UnauthorizedException} When token is invalid or missing
   *
   * @example
   * \`\`\`typescript
   * // Successful authentication adds user to request:
   * // request.user = { id: '123', email: 'user@example.com', roles: ['user'] }
   *
   * // Failed authentication throws UnauthorizedException:
   * // - Invalid token signature
   * // - Expired token
   * // - Malformed token
   * // - Missing token
   * \`\`\`
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
