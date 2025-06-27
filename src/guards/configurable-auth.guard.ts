import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AuthConfig } from '../types';

/**
 * Configurable authentication and authorization guard with flexible validation
 *
 * @description Advanced guard that supports multiple authentication strategies including
 * role-based access, permission-based access, custom validators, and custom guards.
 * Provides comprehensive authorization logic with fallback mechanisms.
 *
 * @example
 * \`\`\`typescript
 * // Use with Auth decorator
 * @Get('sensitive-data')
 * @Auth({
 *   roles: ['admin', 'manager'],
 *   permissions: ['data:read'],
 *   customValidator: async (user, context) => {
 *     return user.department === 'finance';
 *   }
 * })
 * async getSensitiveData() {
 *   // Multi-layered authorization check
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigurableAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Perform comprehensive authentication and authorization checks
   *
   * @description Executes a series of authorization checks in order of precedence:
   * 1. Custom validator (if provided)
   * 2. Custom guard (if provided)
   * 3. Role-based authorization
   * 4. Permission-based authorization
   *
   * @param context - NestJS execution context containing request information
   * @returns Promise resolving to true if all checks pass
   *
   * @throws {UnauthorizedException} When user is not authenticated
   * @throws {ForbiddenException} When authorization checks fail
   *
   * @example
   * \`\`\`typescript
   * // The guard processes AuthConfig in this order:
   * // 1. If customValidator exists, use it exclusively
   * // 2. If custom guard exists, delegate to it
   * // 3. Check roles if specified
   * // 4. Check permissions if specified
   * // 5. Grant access if no restrictions or all checks pass
   * \`\`\`
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authConfig = this.reflector.getAllAndOverride<AuthConfig>(
      'authConfig',
      [context.getHandler(), context.getClass()],
    );

    if (!authConfig) {
      return true; // No auth config means public endpoint
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Use custom validator if provided
    if (authConfig.customValidator) {
      const isValid = await authConfig.customValidator(user, context);
      if (!isValid) {
        throw new ForbiddenException('Access denied by custom validator');
      }
      return true;
    }

    // Use custom guard if provided
    if (authConfig.guard) {
      const canAccess = await authConfig.guard.canActivate(
        context,
        user,
        authConfig.permissions,
      );
      if (!canAccess) {
        throw new ForbiddenException('Access denied by custom guard');
      }
      return true;
    }

    // Default role-based authorization
    if (authConfig.roles?.length) {
      const hasRole = authConfig.roles.some((role) =>
        user.roles?.includes(role),
      );
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Permission-based authorization
    if (authConfig.permissions?.length) {
      const hasPermission = authConfig.permissions.every((permission) =>
        user.permissions?.includes(permission),
      );
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
