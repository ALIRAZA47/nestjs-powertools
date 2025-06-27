import { SetMetadata } from '@nestjs/common';
import {
  type AuthConfig,
  type DefaultRoles,
  type CustomAuthGuard,
  GuardRegistryService,
} from './auth-interfaces';

/**
 * Authentication and authorization decorators with flexible configuration
 *
 * @description Provides a comprehensive set of decorators for configuring authentication
 * and authorization requirements on controller methods. Supports role-based access,
 * permission-based access, custom validators, and registered guards.
 *
 * @example
 * \`\`\`typescript
 * @Controller('api')
 * export class ApiController {
 *   @Get('public')
 *   @Public()
 *   async getPublicData() {
 *     // No authentication required
 *   }
 *
 *   @Get('admin')
 *   @Roles(DefaultRoles.ADMIN)
 *   async getAdminData() {
 *     // Requires admin role
 *   }
 *
 *   @Get('complex')
 *   @Auth({
 *     roles: [DefaultRoles.USER],
 *     permissions: ['data:read'],
 *     customValidator: async (user) => user.isActive
 *   })
 *   async getComplexData() {
 *     // Multiple authorization checks
 *   }
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */

/**
 * Configure comprehensive authentication and authorization for an endpoint
 *
 * @description Main authentication decorator that supports all authorization patterns
 * including roles, permissions, custom validators, and custom guards. Provides
 * the most flexible authentication configuration options.
 *
 * @param config - Authentication configuration object
 * @param config.guard - Custom guard instance for specialized authorization logic
 * @param config.roles - Array of required user roles (user needs at least one)
 * @param config.permissions - Array of required permissions (user needs all)
 * @param config.customValidator - Custom validation function for complex business logic
 * @param config.requireAll - Whether user must meet ALL criteria (default: false)
 *
 * @returns {MethodDecorator} Decorator that applies authentication configuration
 *
 * @example
 * \`\`\`typescript
 * interface User {
 *   id: string;
 *   roles: string[];
 *   permissions: string[];
 *   department: string;
 *   isActive: boolean;
 * }
 *
 * // Basic role-based authentication
 * @Get('admin-panel')
 * @Auth({
 *   roles: [DefaultRoles.ADMIN, DefaultRoles.SUPER_ADMIN]
 * })
 * async getAdminPanel() {
 *   // Requires admin or super_admin role
 * }
 *
 * // Permission-based authentication
 * @Post('sensitive-data')
 * @Auth({
 *   permissions: ['data:create', 'sensitive:access']
 * })
 * async createSensitiveData() {
 *   // Requires both permissions
 * }
 *
 * // Complex business logic authentication
 * @Get('department-data')
 * @Auth({
 *   roles: [DefaultRoles.USER],
 *   customValidator: async (user: User, context) => {
 *     const requestedDept = context.switchToHttp().getRequest().query.department;
 *     return user.department === requestedDept || user.roles.includes('admin');
 *   }
 * })
 * async getDepartmentData(@Query('department') dept: string) {
 *   // User can access their own department data or admin can access any
 * }
 *
 * // Custom guard with fallback
 * @Put('resource/:id')
 * @Auth({
 *   guard: {
 *     canActivate: async (context, user) => {
 *       const resourceId = context.switchToHttp().getRequest().params.id;
 *       return await this.checkResourceOwnership(user.id, resourceId);
 *     }
 *   },
 *   roles: [DefaultRoles.ADMIN] // Fallback: admins can always access
 * })
 * async updateResource(@Param('id') id: string) {
 *   // Resource owner or admin can update
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export const Auth = (config: AuthConfig) => SetMetadata('authConfig', config);

/**
 * Require specific user roles for endpoint access
 *
 * @description Convenience decorator for role-based authorization. Users must have
 * at least one of the specified roles to access the endpoint.
 *
 * @param roles - Variable number of role arguments (strings or DefaultRoles enum values)
 * @returns {MethodDecorator} Decorator that enforces role requirements
 *
 * @example
 * \`\`\`typescript
 * // Single role requirement
 * @Get('admin-only')
 * @Roles(DefaultRoles.ADMIN)
 * async adminOnlyEndpoint() {
 *   // Only admin role can access
 * }
 *
 * // Multiple role options
 * @Get('staff-area')
 * @Roles(DefaultRoles.ADMIN, DefaultRoles.MODERATOR, DefaultRoles.EDITOR)
 * async staffAreaEndpoint() {
 *   // Admin, moderator, or editor can access
 * }
 *
 * // Mix of enum and string roles
 * @Get('special-access')
 * @Roles(DefaultRoles.ADMIN, 'special_user', 'beta_tester')
 * async specialAccessEndpoint() {
 *   // Admin, special_user, or beta_tester can access
 * }
 *
 * // Dynamic role checking
 * const managerRoles = [DefaultRoles.ADMIN, DefaultRoles.MANAGER];
 * @Get('manager-dashboard')
 * @Roles(...managerRoles)
 * async managerDashboard() {
 *   // Roles can be defined dynamically
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export const Roles = (...roles: (string | DefaultRoles)[]) =>
  SetMetadata('authConfig', { roles } as AuthConfig);

/**
 * Require specific permissions for endpoint access
 *
 * @description Convenience decorator for permission-based authorization. Users must have
 * ALL specified permissions to access the endpoint.
 *
 * @param permissions - Variable number of permission strings
 * @returns {MethodDecorator} Decorator that enforces permission requirements
 *
 * @example
 * \`\`\`typescript
 * // Single permission requirement
 * @Get('user-list')
 * @Permissions('users:read')
 * async getUserList() {
 *   // Requires users:read permission
 * }
 *
 * // Multiple permission requirements (ALL required)
 * @Post('create-admin')
 * @Permissions('users:create', 'admin:grant', 'system:modify')
 * async createAdminUser() {
 *   // Requires ALL three permissions
 * }
 *
 * // Resource-specific permissions
 * @Delete('posts/:id')
 * @Permissions('posts:delete', 'content:moderate')
 * async deletePost(@Param('id') id: string) {
 *   // Requires both post deletion and content moderation permissions
 * }
 *
 * // Hierarchical permissions
 * @Get('financial-reports')
 * @Permissions('reports:read', 'financial:access', 'sensitive:view')
 * async getFinancialReports() {
 *   // Requires progressively more specific permissions
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata('authConfig', { permissions } as AuthConfig);

/**
 * Use a guard that has been registered in the guard registry
 *
 * @description Applies a custom guard that was previously registered using GuardHelper.
 * Provides a way to reuse complex authorization logic across multiple endpoints.
 *
 * @param guardName - Name of the registered guard to apply
 * @returns {MethodDecorator} Decorator that applies the registered guard
 *
 * @example
 * \`\`\`typescript
 * // First, register guards at application startup
 * GuardHelper.registerGuard('businessHours',
 *   GuardHelper.createTimeBasedGuard({ start: 9, end: 17 })
 * );
 *
 * GuardHelper.registerGuard('resourceOwner',
 *   GuardHelper.createOwnershipGuard('userId')
 * );
 *
 * GuardHelper.registerGuard('weekdaysOnly', {
 *   canActivate: (context, user) => {
 *     const day = new Date().getDay();
 *     return day >= 1 && day <= 5; // Monday to Friday
 *   }
 * });
 *
 * // Then use in controllers
 * @Get('business-operation')
 * @UseRegisteredGuard('businessHours')
 * async businessOperation() {
 *   // Only accessible during business hours (9 AM - 5 PM)
 * }
 *
 * @Get('profile/:userId')
 * @UseRegisteredGuard('resourceOwner')
 * async getUserProfile(@Param('userId') userId: string) {
 *   // Only accessible by resource owner or admin
 * }
 *
 * @Post('weekday-task')
 * @UseRegisteredGuard('weekdaysOnly')
 * async performWeekdayTask() {
 *   // Only accessible Monday through Friday
 * }
 *
 * // Error handling for unregistered guards
 * @Get('test')
 * @UseRegisteredGuard('nonexistent') // Will fail at runtime
 * async testEndpoint() {
 *   // Guard not found error
 * }
 * \`\`\`
 *
 * @throws {Error} At runtime if the specified guard name is not registered
 *
 * @see GuardHelper.registerGuard For registering custom guards
 * @see GuardHelper.getRegisteredGuards For listing available guards
 *
 * @since 1.0.0
 */
export const UseRegisteredGuard = (guardName: string) => {
  const registry = GuardRegistryService.getInstance();
  const guard = registry.getGuard(guardName);
  return SetMetadata('authConfig', { guard } as AuthConfig);
};

/**
 * Use inline custom guard
 */
export const UseInlineGuard = (guard: CustomAuthGuard) =>
  SetMetadata('authConfig', { guard } as AuthConfig);

/**
 * Custom validator function
 */
export const CustomAuth = (validator: AuthConfig['customValidator']) =>
  SetMetadata('authConfig', { customValidator: validator } as AuthConfig);

/**
 * Mark endpoint as public (no authentication required)
 */
export const Public = () => SetMetadata('isPublic', true);
