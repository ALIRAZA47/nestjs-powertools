/**
 * Role-based authorization guard
 *
 * @description Guard that restricts access based on user roles. Checks if the authenticated
 * user has at least one of the required roles specified in the route metadata.
 * Integrates with NestJS reflection system to read role requirements from decorators.
 *
 * @example
 * \`\`\`typescript
 * // Apply globally
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: RolesGuard,
 *     }
 *   ]
 * })
 * export class AppModule {}
 *
 * // Use with role decorators
 * @Controller('admin')
 * @UseGuards(RolesGuard)
 * export class AdminController {
 *   @Get('users')
 *   @Roles('admin', 'moderator')
 *   async getUsers() {
 *     // Only accessible by admin or moderator roles
 *   }
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determine if the current user can activate the route
   *
   * @description Validates that the authenticated user has at least one of the
   * required roles. If no roles are specified, access is granted by default.
   *
   * @param context - NestJS execution context containing request information
   * @returns Promise resolving to true if access is granted, false otherwise
   *
   * @throws {ForbiddenException} When user lacks required roles
   * @throws {ForbiddenException} When user is not found in request
   *
   * @example
   * \`\`\`typescript
   * // The guard automatically:
   * // 1. Extracts required roles from method/class metadata
   * // 2. Gets user from request.user (set by authentication)
   * // 3. Checks if user.roles includes any required role
   * // 4. Grants or denies access accordingly
   * \`\`\`
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
