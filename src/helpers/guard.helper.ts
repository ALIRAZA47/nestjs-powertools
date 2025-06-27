import type { ExecutionContext } from '@nestjs/common';
import {
  GuardRegistryService,
  RoleBasedGuard,
  PermissionBasedGuard,
  OwnershipGuard,
  TimeBasedGuard,
} from '../config/guard-registry';
import type { CustomAuthGuard } from '../types';

/**
 * Comprehensive guard management and creation utility
 *
 * @description Provides a centralized system for creating, registering, and managing
 * custom guards. Includes factory methods for common guard patterns and advanced
 * composite guard creation capabilities.
 *
 * @example
 * \`\`\`typescript
 * // Register custom guards at application startup
 * GuardHelper.registerGuard('businessHours',
 *   GuardHelper.createTimeBasedGuard({ start: 9, end: 17 })
 * );
 *
 * GuardHelper.registerGuard('resourceOwner',
 *   GuardHelper.createOwnershipGuard('userId')
 * );
 *
 * // Use in controllers
 * @Get('sensitive-operation')
 * @UseCustomGuard('businessHours')
 * async sensitiveOperation() {
 *   // Only accessible during business hours
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export class GuardHelper {
  private static registry = GuardRegistryService.getInstance();

  /**
   * Register a custom guard with a unique name
   *
   * @description Stores a guard instance in the global registry for reuse across
   * the application. Registered guards can be referenced by name in decorators.
   *
   * @param name - Unique identifier for the guard
   * @param guard - Guard instance implementing CustomAuthGuard interface
   *
   * @example
   * \`\`\`typescript
   * // Register a custom business logic guard
   * const departmentGuard = {
   *   canActivate: (context, user) => {
   *     return user.department === 'engineering' || user.roles.includes('admin');
   *   }
   * };
   *
   * GuardHelper.registerGuard('engineeringOnly', departmentGuard);
   *
   * // Register a time-based guard
   * GuardHelper.registerGuard('weekdaysOnly',
   *   GuardHelper.createTimeBasedGuard({ start: 0, end: 23, weekdaysOnly: true })
   * );
   *
   * // Register a complex composite guard
   * GuardHelper.registerGuard('complexAuth',
   *   GuardHelper.createCompositeGuard([
   *     GuardHelper.createRoleGuard(['admin', 'manager']),
   *     GuardHelper.createTimeBasedGuard({ start: 8, end: 18 })
   *   ], 'AND')
   * );
   * \`\`\`
   *
   * @since 1.0.0
   */
  static registerGuard(name: string, guard: CustomAuthGuard): void {
    this.registry.registerGuard(name, guard);
  }

  /**
   * Create a role-based authorization guard
   *
   * @description Factory method for creating guards that check user roles.
   * Users must have at least one of the specified roles to pass authorization.
   *
   * @param roles - Array of role names that are allowed access
   * @returns CustomAuthGuard instance that validates user roles
   *
   * @example
   * \`\`\`typescript
   * // Create guard for admin and manager roles
   * const adminManagerGuard = GuardHelper.createRoleGuard(['admin', 'manager']);
   *
   * // Register for reuse
   * GuardHelper.registerGuard('adminOrManager', adminManagerGuard);
   *
   * // Use directly in decorators
   * @UseGuards(adminManagerGuard)
   * async sensitiveOperation() {
   *   // Only admin or manager can access
   * }
   *
   * // Create single-role guard
   * const adminOnlyGuard = GuardHelper.createRoleGuard(['admin']);
   * \`\`\`
   *
   * @since 1.0.0
   */
  static createRoleGuard(roles: string[]): CustomAuthGuard {
    return new RoleBasedGuard(roles);
  }

  /**
   * Create a permission-based authorization guard
   *
   * @description Factory method for creating guards that check user permissions.
   * Users must have ALL specified permissions to pass authorization.
   *
   * @param permissions - Array of permission strings that are required
   * @returns CustomAuthGuard instance that validates user permissions
   *
   * @example
   * \`\`\`typescript
   * // Create guard requiring multiple permissions
   * const fileAccessGuard = GuardHelper.createPermissionGuard([
   *   'files:read',
   *   'files:download'
   * ]);
   *
   * // Create guard for sensitive operations
   * const auditGuard = GuardHelper.createPermissionGuard([
   *   'audit:read',
   *   'system:access'
   * ]);
   *
   * // Register and use
   * GuardHelper.registerGuard('fileAccess', fileAccessGuard);
   *
   * @Get('download/:id')
   * @UseCustomGuard('fileAccess')
   * async downloadFile(@Param('id') id: string) {
   *   // Requires both files:read AND files:download permissions
   * }
   * \`\`\`
   *
   * @since 1.0.0
   */
  static createPermissionGuard(permissions: string[]): CustomAuthGuard {
    return new PermissionBasedGuard(permissions);
  }

  /**
   * Create a resource ownership authorization guard
   *
   * @description Factory method for creating guards that verify resource ownership.
   * Allows access if the user owns the resource or has admin privileges.
   *
   * @param resourceIdParam - Name of the route parameter containing the resource ID (default: "id")
   * @returns CustomAuthGuard instance that validates resource ownership
   *
   * @example
   * \`\`\`typescript
   * // Create guard for user profile access
   * const profileOwnerGuard = GuardHelper.createOwnershipGuard('userId');
   *
   * // Create guard for document access
   * const documentOwnerGuard = GuardHelper.createOwnershipGuard('documentId');
   *
   * // Register and use
   * GuardHelper.registerGuard('profileOwner', profileOwnerGuard);
   *
   * @Get('profile/:userId')
   * @UseCustomGuard('profileOwner')
   * async getUserProfile(@Param('userId') userId: string, @CurrentUser() user: User) {
   *   // Only accessible by the profile owner or admin
   *   // Compares user.id with userId parameter
   * }
   *
   * @Put('documents/:documentId')
   * @UseGuards(documentOwnerGuard)
   * async updateDocument(@Param('documentId') docId: string) {
   *   // Only document owner or admin can update
   * }
   * \`\`\`
   *
   * @since 1.0.0
   */
  static createOwnershipGuard(resourceIdParam = 'id'): CustomAuthGuard {
    return new OwnershipGuard(resourceIdParam);
  }

  /**
   * Create a time-based authorization guard
   *
   * @description Factory method for creating guards that restrict access based on
   * time of day. Useful for business hours restrictions or maintenance windows.
   *
   * @param allowedHours - Time range configuration
   * @param allowedHours.start - Start hour (0-23, default: 9)
   * @param allowedHours.end - End hour (0-23, default: 17)
   * @returns CustomAuthGuard instance that validates time-based access
   *
   * @example
   * \`\`\`typescript
   * // Business hours guard (9 AM to 5 PM)
   * const businessHoursGuard = GuardHelper.createTimeBasedGuard({
   *   start: 9,
   *   end: 17
   * });
   *
   * // Extended hours guard (6 AM to 10 PM)
   * const extendedHoursGuard = GuardHelper.createTimeBasedGuard({
   *   start: 6,
   *   end: 22
   * });
   *
   * // Maintenance window guard (2 AM to 4 AM - inverted logic)
   * const maintenanceGuard = GuardHelper.createTimeBasedGuard({
   *   start: 2,
   *   end: 4
   * });
   *
   * // Register and use
   * GuardHelper.registerGuard('businessHours', businessHoursGuard);
   *
   * @Post('sensitive-operation')
   * @UseCustomGuard('businessHours')
   * async performSensitiveOperation() {
   *   // Only accessible during business hours
   * }
   * \`\`\`
   *
   * @since 1.0.0
   */
  static createTimeBasedGuard(allowedHours: {
    start: number;
    end: number;
  }): CustomAuthGuard {
    return new TimeBasedGuard(allowedHours);
  }

  /**
   * Create a composite guard that combines multiple guards with logical operators
   *
   * @description Factory method for creating complex authorization logic by combining
   * multiple guards with AND, OR, or other logical operations.
   *
   * @param guards - Array of guards to combine
   * @param operator - Logical operator to apply ("AND" | "OR", default: "AND")
   * @returns CustomAuthGuard instance that applies composite logic
   *
   * @example
   * \`\`\`typescript
   * // Create AND composite guard (all guards must pass)
   * const strictAccessGuard = GuardHelper.createCompositeGuard([
   *   GuardHelper.createRoleGuard(['admin', 'manager']),
   *   GuardHelper.createTimeBasedGuard({ start: 9, end: 17 }),
   *   GuardHelper.createPermissionGuard(['sensitive:access'])
   * ], 'AND');
   *
   * // Create OR composite guard (any guard can pass)
   * const flexibleAccessGuard = GuardHelper.createCompositeGuard([
   *   GuardHelper.createRoleGuard(['admin']),
   *   GuardHelper.createOwnershipGuard('userId'),
   *   GuardHelper.createPermissionGuard(['override:access'])
   * ], 'OR');
   *
   * // Complex nested logic
   * const complexGuard = GuardHelper.createCompositeGuard([
   *   // Either admin role OR (manager role AND business hours)
   *   GuardHelper.createCompositeGuard([
   *     GuardHelper.createRoleGuard(['admin'])
   *   ], 'OR'),
   *   GuardHelper.createCompositeGuard([
   *     GuardHelper.createRoleGuard(['manager']),
   *     GuardHelper.createTimeBasedGuard({ start: 9, end: 17 })
   *   ], 'AND')
   * ], 'OR');
   *
   * // Register and use
   * GuardHelper.registerGuard('strictAccess', strictAccessGuard);
   * \`\`\`
   *
   * @since 1.0.0
   */
  static createCompositeGuard(
    guards: CustomAuthGuard[],
    operator: 'AND' | 'OR' = 'AND',
  ): CustomAuthGuard {
    return {
      async canActivate(
        context: ExecutionContext,
        user: any,
        requiredPermissions?: string[],
      ): Promise<boolean> {
        const results = await Promise.all(
          guards.map((guard) =>
            guard.canActivate(context, user, requiredPermissions),
          ),
        );

        return operator === 'AND'
          ? results.every((result) => result)
          : results.some((result) => result);
      },
    };
  }

  /**
   * Get list of all registered guard names
   *
   * @description Returns an array of all guard names that have been registered
   * in the global registry. Useful for debugging and administration.
   *
   * @returns Array of registered guard names
   *
   * @example
   * \`\`\`typescript
   * // Register some guards
   * GuardHelper.registerGuard('businessHours', businessHoursGuard);
   * GuardHelper.registerGuard('adminOnly', adminGuard);
   * GuardHelper.registerGuard('resourceOwner', ownershipGuard);
   *
   * // Get all registered names
   * const guardNames = GuardHelper.getRegisteredGuards();
   * console.log(guardNames); // ['businessHours', 'adminOnly', 'resourceOwner']
   *
   * // Use for validation or debugging
   * function validateGuardExists(guardName: string) {
   *   const registeredGuards = GuardHelper.getRegisteredGuards();
   *   if (!registeredGuards.includes(guardName)) {
   *     throw new Error(`Guard '${guardName}' is not registered`);
   *   }
   * }
   * \`\`\`
   *
   * @since 1.0.0
   */
  static getRegisteredGuards(): string[] {
    return Object.keys(this.registry.getAllGuards());
  }

  /**
   * Remove a registered guard from the registry
   *
   * @description Removes a guard from the global registry, making it unavailable
   * for future use. Useful for cleanup or dynamic guard management.
   *
   * @param name - Name of the guard to remove
   * @returns True if the guard was removed, false if it didn't exist
   *
   * @example
   * \`\`\`typescript
   * // Register a temporary guard
   * GuardHelper.registerGuard('temporary', temporaryGuard);
   *
   * // Use the guard...
   *
   * // Remove when no longer needed
   * const removed = GuardHelper.removeGuard('temporary');
   * console.log(removed); // true
   *
   * // Try to remove non-existent guard
   * const notRemoved = GuardHelper.removeGuard('nonexistent');
   * console.log(notRemoved); // false
   *
   * // Cleanup all test guards
   * const testGuards = ['test1', 'test2', 'test3'];
   * testGuards.forEach(guardName => {
   *   GuardHelper.removeGuard(guardName);
   * });
   * \`\`\`
   *
   * @since 1.0.0
   */
  static removeGuard(name: string): boolean {
    return this.registry.removeGuard(name);
  }
}
