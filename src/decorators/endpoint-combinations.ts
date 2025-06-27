import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type {
  ValidationConfig,
  CacheConfig,
  RateLimitConfig,
  LoggingConfig,
  AuthConfig,
  AuditConfig,
  ResilientHttpConfig,
} from '../types/generics';
import {
  DefaultRoles,
  HttpStatusCodes,
  AuditAction,
  type GuardLogic,
} from '../types/enums';
import { PowertoolsConfigService } from '../config/powertools.config';

/**
 * Enhanced secure endpoint decorator with full generic support and configuration
 *
 * @description Creates a secure endpoint that requires authentication and supports extensive
 * configuration for authorization, validation, logging, and API documentation.
 * Provides full TypeScript generic support for type-safe user and response objects.
 *
 * @template TUser - Type of the authenticated user object
 * @template TResponse - Type of the response data
 *
 * @param config - Configuration object for the secure endpoint
 * @param config.roles - Array of required user roles
 * @param config.permissions - Array of required permissions
 * @param config.customValidator - Custom validation function for complex authorization logic
 * @param config.validation - Validation configuration for request data
 * @param config.logging - Logging configuration for the endpoint
 * @param config.description - API documentation description
 * @param config.responses - Array of possible HTTP responses for documentation
 *
 * @returns {MethodDecorator} Decorator that applies security and configuration
 *
 * @example
 * \`\`\`typescript
 * interface User {
 *   id: string;
 *   roles: string[];
 *   department: string;
 * }
 *
 * interface UserResponse {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * @Get('sensitive-data')
 * @SecureEndpoint<User, UserResponse>({
 *   roles: [DefaultRoles.ADMIN, DefaultRoles.MANAGER],
 *   customValidator: async (user, context) => {
 *     // Additional business logic validation
 *     return user.department === 'finance' || user.roles.includes('auditor');
 *   },
 *   description: 'Access sensitive financial data',
 *   responses: [
 *     {
 *       status: HttpStatusCodes.OK,
 *       description: 'Data retrieved successfully',
 *       type: UserResponse
 *     },
 *     {
 *       status: HttpStatusCodes.FORBIDDEN,
 *       description: 'Insufficient permissions'
 *     }
 *   ]
 * })
 * async getSensitiveData(@CurrentUser() user: User): Promise<ApiResponse<UserResponse>> {
 *   // Implementation with type safety
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function SecureEndpoint<TUser = any, TResponse = any>(
  config?: AuthConfig<TUser> & {
    validation?: ValidationConfig;
    logging?: LoggingConfig;
    description?: string;
    responses?: Array<{
      status: HttpStatusCodes;
      description: string;
      type?: new () => TResponse;
    }>;
  },
): MethodDecorator {
  const configService = PowertoolsConfigService.getInstance();
  const globalConfig = configService.getConfig();

  const decorators: Array<ClassDecorator | MethodDecorator> = [
    ApiBearerAuth(),
    SetMetadata('auth-config', { ...globalConfig.auth, ...config }),
  ];

  if (config?.description) {
    decorators.push(ApiOperation({ summary: config.description }));
  }

  if (config?.responses?.length) {
    config.responses.forEach((response) => {
      decorators.push(
        ApiResponse({
          status: response.status,
          description: response.description,
          type: response.type,
        }),
      );
    });
  }

  return applyDecorators(...decorators);
}

/**
 * Enhanced public cached endpoint decorator with generic response typing
 *
 * @description Creates a public endpoint (no authentication required) with optional caching,
 * rate limiting, and validation. Optimized for public APIs and content delivery.
 *
 * @template TResponse - Type of the response data
 *
 * @param options - Configuration options for the public endpoint
 * @param options.cache - Caching configuration including TTL and strategy
 * @param options.rateLimit - Rate limiting configuration to prevent abuse
 * @param options.validation - Request validation configuration
 * @param options.description - API documentation description
 * @param options.responseType - Response type class for OpenAPI documentation
 *
 * @returns {MethodDecorator} Decorator that applies public endpoint configuration
 *
 * @example
 * \`\`\`typescript
 * interface PublicArticle {
 *   id: string;
 *   title: string;
 *   content: string;
 *   publishedAt: Date;
 * }
 *
 * @Get('public/articles')
 * @PublicCachedEndpoint<PublicArticle[]>({
 *   cache: {
 *     ttl: 300000, // 5 minutes
 *     strategy: CacheStrategy.REDIS
 *   },
 *   rateLimit: {
 *     max: 100,
 *     windowMs: 60000 // 100 requests per minute
 *   },
 *   description: 'Get published articles',
 *   responseType: PublicArticle
 * })
 * async getPublicArticles(): Promise<ApiResponse<PublicArticle[]>> {
 *   // Public endpoint with caching and rate limiting
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function PublicCachedEndpoint<TResponse = any>(options?: {
  cache?: CacheConfig<TResponse>;
  rateLimit?: RateLimitConfig;
  validation?: ValidationConfig;
  description?: string;
  responseType?: new () => TResponse;
}): MethodDecorator {
  const configService = PowertoolsConfigService.getInstance();
  const decorators: any[] = [];

  if (options?.description) {
    decorators.push(ApiOperation({ summary: options.description }));
  }

  if (options?.responseType) {
    decorators.push(
      ApiResponse({
        status: HttpStatusCodes.OK,
        description: 'Success',
        type: options.responseType,
      }),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Admin-only endpoint decorator with enhanced type safety
 *
 * @description Quick decorator for endpoints that should only be accessible by administrators.
 * Automatically configures authentication, authorization, and API documentation.
 *
 * @template TResponse - Type of the response data
 *
 * @param description - Optional description for API documentation
 * @param responseType - Optional response type class for OpenAPI documentation
 *
 * @returns {MethodDecorator} Decorator that restricts access to admin users only
 *
 * @example
 * \`\`\`typescript
 * interface SystemStats {
 *   userCount: number;
 *   activeConnections: number;
 *   systemHealth: string;
 * }
 *
 * @Get('admin/system-stats')
 * @AdminOnly<SystemStats>('Get system statistics', SystemStats)
 * async getSystemStats(): Promise<ApiResponse<SystemStats>> {
 *   // Only accessible by admin users
 *   return this.systemService.getStats();
 * }
 *
 * @Delete('admin/users/:id')
 * @AdminOnly('Delete user account')
 * async deleteUser(@Param('id') userId: string): Promise<ApiResponse<void>> {
 *   // Admin-only user deletion
 *   await this.userService.deleteUser(userId);
 *   return ResponseFormatter.success(null, 'User deleted successfully');
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function AdminOnly<TResponse = any>(
  description?: string,
  responseType?: new () => TResponse,
): MethodDecorator {
  return SecureEndpoint<any, TResponse>({
    roles: [DefaultRoles.ADMIN],
    description: description || 'Admin only endpoint',
    responses: [
      {
        status: HttpStatusCodes.OK,
        description: 'Success',
        type: responseType,
      },
      {
        status: HttpStatusCodes.UNAUTHORIZED,
        description: 'Unauthorized',
      },
      {
        status: HttpStatusCodes.FORBIDDEN,
        description: 'Forbidden',
      },
    ],
  });
}

/**
 * User endpoint decorator for authenticated user access
 *
 * @description Quick decorator for endpoints accessible by authenticated users.
 * Includes both regular users and administrators by default.
 *
 * @template TResponse - Type of the response data
 *
 * @param description - Optional description for API documentation
 * @param responseType - Optional response type class for OpenAPI documentation
 *
 * @returns {MethodDecorator} Decorator that requires user authentication
 *
 * @example
 * \`\`\`typescript
 * interface UserProfile {
 *   id: string;
 *   name: string;
 *   email: string;
 *   preferences: Record<string, any>;
 * }
 *
 * @Get('profile')
 * @UserEndpoint<UserProfile>('Get user profile', UserProfile)
 * async getUserProfile(@CurrentUser() user: User): Promise<ApiResponse<UserProfile>> {
 *   // Accessible by any authenticated user
 *   return this.userService.getProfile(user.id);
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function UserEndpoint<TResponse = any>(
  description?: string,
  responseType?: new () => TResponse,
): MethodDecorator {
  return SecureEndpoint<any, TResponse>({
    roles: [DefaultRoles.USER, DefaultRoles.ADMIN],
    description: description || 'User endpoint',
    validation: { transform: true, whitelist: true },
    responses: [
      {
        status: HttpStatusCodes.OK,
        description: 'Success',
        type: responseType,
      },
      {
        status: HttpStatusCodes.UNAUTHORIZED,
        description: 'Unauthorized',
      },
    ],
  });
}

/**
 * Role-based endpoint decorator with flexible role requirements
 *
 * @description Decorator that restricts access to users with specific roles.
 * Supports both string roles and enum-based roles for type safety.
 *
 * @template TResponse - Type of the response data
 *
 * @param roles - Array of required roles (user must have at least one)
 * @param description - Optional description for API documentation
 * @param responseType - Optional response type class for OpenAPI documentation
 *
 * @returns {MethodDecorator} Decorator that enforces role-based access control
 *
 * @example
 * \`\`\`typescript
 * interface ModeratorAction {
 *   action: string;
 *   targetId: string;
 *   reason: string;
 *   timestamp: Date;
 * }
 *
 * @Post('moderate/content/:id')
 * @RequireRoles<ModeratorAction>(
 *   [DefaultRoles.MODERATOR, DefaultRoles.ADMIN],
 *   'Moderate content',
 *   ModeratorAction
 * )
 * async moderateContent(
 *   @Param('id') contentId: string,
 *   @Body() action: ModerateContentDto
 * ): Promise<ApiResponse<ModeratorAction>> {
 *   // Only moderators and admins can access
 *   return this.moderationService.moderateContent(contentId, action);
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function RequireRoles<TResponse = any>(
  roles: (string | DefaultRoles)[],
  description?: string,
  responseType?: new () => TResponse,
): MethodDecorator {
  return SecureEndpoint<any, TResponse>({
    roles,
    description: description || `Requires roles: ${roles.join(', ')}`,
    responses: responseType
      ? [
          {
            status: HttpStatusCodes.OK,
            description: 'Success',
            type: responseType,
          },
        ]
      : undefined,
  });
}

/**
 * Permission-based endpoint decorator with granular access control
 *
 * @description Decorator that restricts access based on specific permissions.
 * Provides fine-grained access control beyond simple role-based authorization.
 *
 * @template TResponse - Type of the response data
 *
 * @param permissions - Array of required permissions (user must have all)
 * @param description - Optional description for API documentation
 * @param responseType - Optional response type class for OpenAPI documentation
 *
 * @returns {MethodDecorator} Decorator that enforces permission-based access control
 *
 * @example
 * \`\`\`typescript
 * interface FinancialReport {
 *   revenue: number;
 *   expenses: number;
 *   profit: number;
 *   period: string;
 * }
 *
 * @Get('reports/financial')
 * @RequirePermissions<FinancialReport>(
 *   ['reports:read', 'financial:access'],
 *   'Access financial reports',
 *   FinancialReport
 * )
 * async getFinancialReport(): Promise<ApiResponse<FinancialReport>> {
 *   // Requires both 'reports:read' AND 'financial:access' permissions
 *   return this.reportsService.getFinancialReport();
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function RequirePermissions<TResponse = any>(
  permissions: string[],
  description?: string,
  responseType?: new () => TResponse,
): MethodDecorator {
  return SecureEndpoint<any, TResponse>({
    permissions,
    description:
      description || `Requires permissions: ${permissions.join(', ')}`,
    responses: responseType
      ? [
          {
            status: HttpStatusCodes.OK,
            description: 'Success',
            type: responseType,
          },
        ]
      : undefined,
  });
}

/**
 * Ultimate power endpoint decorator with comprehensive configuration
 *
 * @description The most flexible endpoint decorator that combines all available features:
 * authentication, authorization, audit logging, resilient HTTP, caching, rate limiting,
 * validation, and comprehensive API documentation. Provides full generic type support.
 *
 * @template TUser - Type of the authenticated user object
 * @template TResponse - Type of the response data
 * @template TAuditMeta - Type of custom audit metadata
 *
 * @param options - Comprehensive configuration object
 * @param options.auth - Authentication and authorization configuration
 * @param options.guards - Array of custom guards to apply
 * @param options.guardLogic - Logic for combining multiple guards (AND/OR)
 * @param options.audit - Audit logging configuration
 * @param options.resilientHttp - Resilient HTTP configuration for external calls
 * @param options.cache - Caching configuration
 * @param options.rateLimit - Rate limiting configuration
 * @param options.validation - Request validation configuration
 * @param options.logging - Logging configuration
 * @param options.description - API documentation description
 * @param options.responseType - Response type class for documentation
 * @param options.responses - Array of possible responses for documentation
 *
 * @returns {MethodDecorator} Decorator that applies all configured features
 *
 * @example
 * \`\`\`typescript
 * interface User {
 *   id: string;
 *   email: string;
 *   roles: string[];
 *   department: string;
 * }
 *
 * interface CreateOrderResponse {
 *   orderId: string;
 *   status: string;
 *   estimatedDelivery: Date;
 * }
 *
 * interface OrderAuditMetadata {
 *   customerType: string;
 *   orderValue: number;
 *   paymentMethod: string;
 * }
 *
 * @Post('orders')
 * @PowerEndpoint<User, CreateOrderResponse, OrderAuditMetadata>({
 *   // Authentication & Authorization
 *   auth: {
 *     roles: [DefaultRoles.USER, DefaultRoles.PREMIUM_USER],
 *     customValidator: async (user, context) => {
 *       const orderData = context.switchToHttp().getRequest().body;
 *       return user.department === 'sales' || orderData.amount < 1000;
 *     }
 *   },
 *
 *   // Audit Logging
 *   audit: {
 *     action: AuditAction.CREATE,
 *     resource: 'Order',
 *     level: AuditLevel.HIGH,
 *     includeRequestBody: true,
 *     customMetadata: (context, user) => ({
 *       customerType: user.roles.includes('premium') ? 'premium' : 'standard',
 *       orderValue: context.switchToHttp().getRequest().body.amount,
 *       paymentMethod: context.switchToHttp().getRequest().body.paymentMethod
 *     })
 *   },
 *
 *   // Resilient HTTP for external service calls
 *   resilientHttp: {
 *     timeout: 15000,
 *     retry: {
 *       maxAttempts: 3,
 *       strategy: RetryStrategy.EXPONENTIAL_BACKOFF
 *     },
 *     circuitBreaker: {
 *       failureThreshold: 5,
 *       resetTimeout: 60000
 *     }
 *   },
 *
 *   // Rate Limiting
 *   rateLimit: {
 *     max: 10,
 *     windowMs: 60000, // 10 orders per minute
 *     strategy: RateLimitStrategy.SLIDING_WINDOW
 *   },
 *
 *   // Validation
 *   validation: {
 *     transform: true,
 *     whitelist: true,
 *     forbidNonWhitelisted: true
 *   },
 *
 *   // API Documentation
 *   description: 'Create a new order with comprehensive validation and audit',
 *   responseType: CreateOrderResponse,
 *   responses: [
 *     {
 *       status: HttpStatusCodes.CREATED,
 *       description: 'Order created successfully',
 *       type: CreateOrderResponse
 *     },
 *     {
 *       status: HttpStatusCodes.BAD_REQUEST,
 *       description: 'Invalid order data'
 *     },
 *     {
 *       status: HttpStatusCodes.TOO_MANY_REQUESTS,
 *       description: 'Rate limit exceeded'
 *     }
 *   ]
 * })
 * async createOrder(
 *   @Body() orderData: CreateOrderDto,
 *   @CurrentUser() user: User
 * ): Promise<ApiResponse<CreateOrderResponse>> {
 *   // All features are automatically applied:
 *   // - Authentication check
 *   // - Role and custom validation
 *   // - Rate limiting
 *   // - Request validation
 *   // - Audit logging
 *   // - Resilient HTTP for external calls
 *
 *   const order = await this.orderService.createOrder(orderData, user);
 *   return ResponseFormatter.success(order, 'Order created successfully');
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function PowerEndpoint<
  TUser = any,
  TResponse = any,
  TAuditMeta = any,
>(options: {
  // Authentication & Authorization
  auth?: AuthConfig<TUser>;
  guards?: any[];
  guardLogic?: GuardLogic;

  // Audit Configuration
  audit?: AuditConfig<TUser, TAuditMeta>;

  // Resilient HTTP
  resilientHttp?: ResilientHttpConfig;

  // Caching
  cache?: CacheConfig<TResponse>;

  // Rate Limiting
  rateLimit?: RateLimitConfig;

  // Validation
  validation?: ValidationConfig;

  // Logging
  logging?: LoggingConfig;

  // API Documentation
  description?: string;
  responseType?: new () => TResponse;
  responses?: Array<{
    status: HttpStatusCodes;
    description: string;
    type?: new () => any;
  }>;
}): MethodDecorator {
  const decorators: any[] = [];

  // Add authentication if configured
  if (options.auth || options.guards) {
    decorators.push(SetMetadata('power-endpoint-config', options));
  }

  // Add API documentation
  if (options.description) {
    decorators.push(ApiOperation({ summary: options.description }));
  }

  // Add response documentation
  if (options.responses?.length) {
    options.responses.forEach((response) => {
      decorators.push(
        ApiResponse({
          status: response.status,
          description: response.description,
          type: response.type,
        }),
      );
    });
  } else if (options.responseType) {
    decorators.push(
      ApiResponse({
        status: HttpStatusCodes.OK,
        description: 'Success',
        type: options.responseType,
      }),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * CRUD endpoint decorator with full generics support for entity operations
 *
 * @description Specialized decorator for CRUD operations that automatically configures
 * authentication, authorization, audit logging, and API documentation based on the
 * entity type and operation context.
 *
 * @template TEntity - Type of the entity being operated on
 * @template TCreateDto - Type of the creation DTO
 * @template TUpdateDto - Type of the update DTO
 *
 * @param options - CRUD-specific configuration options
 * @param options.entity - Entity class for type inference and documentation
 * @param options.createDto - Optional DTO class for create operations
 * @param options.updateDto - Optional DTO class for update operations
 * @param options.roles - Required roles for the operation
 * @param options.permissions - Required permissions for the operation
 * @param options.audit - Whether to enable audit logging
 * @param options.cache - Whether to enable response caching
 * @param options.description - Custom description for the operation
 *
 * @returns {MethodDecorator} Decorator configured for CRUD operations
 *
 * @example
 * \`\`\`typescript
 * class User {
 *   id: string;
 *   email: string;
 *   name: string;
 *   createdAt: Date;
 * }
 *
 * class CreateUserDto {
 *   email: string;
 *   name: string;
 *   password: string;
 * }
 *
 * class UpdateUserDto {
 *   name?: string;
 *   email?: string;
 * }
 *
 * @Post('users')
 * @CrudEndpoint<User, CreateUserDto, UpdateUserDto>({
 *   entity: User,
 *   createDto: CreateUserDto,
 *   roles: [DefaultRoles.ADMIN],
 *   permissions: ['user:create'],
 *   audit: true,
 *   description: 'Create a new user account'
 * })
 * async createUser(@Body() userData: CreateUserDto): Promise<ApiResponse<User>> {
 *   // Automatically configured with:
 *   // - Admin role requirement
 *   // - user:create permission check
 *   // - Audit logging for CREATE action
 *   // - Type-safe request/response handling
 *
 *   const user = await this.userService.create(userData);
 *   return ResponseFormatter.success(user, 'User created successfully');
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export function CrudEndpoint<
  TEntity = any,
  TCreateDto = any,
  TUpdateDto = any,
>(options: {
  entity: new () => TEntity;
  createDto?: new () => TCreateDto;
  updateDto?: new () => TUpdateDto;
  roles?: (string | DefaultRoles)[];
  permissions?: string[];
  audit?: boolean;
  cache?: boolean;
  description?: string;
}): MethodDecorator {
  return PowerEndpoint<any, TEntity>({
    auth: {
      roles: options.roles,
      permissions: options.permissions,
    },
    audit: options.audit
      ? {
          action: AuditAction.CREATE, // This would be dynamic based on HTTP method
          resource: options.entity.name,
          includeRequestBody: true,
        }
      : undefined,
    cache: options.cache ? { ttl: 300000 } : undefined,
    description: options.description,
    responseType: options.entity,
  });
}

/**
 * Use a custom guard by name from the guard registry
 *
 * @description Applies a custom guard that has been registered in the guard registry.
 * Useful for applying business-specific authorization logic that has been pre-configured.
 *
 * @param guardName - Name of the registered guard to apply
 * @param description - Optional description for API documentation
 *
 * @returns {MethodDecorator} Decorator that applies the named custom guard
 *
 * @example
 * \`\`\`typescript
 * // First, register a custom guard
 * GuardHelper.registerGuard('businessHours', GuardHelper.createTimeBasedGuard({
 *   start: 9,
 *   end: 17
 * }));
 *
 * GuardHelper.registerGuard('resourceOwner', GuardHelper.createOwnershipGuard('userId'));
 *
 * @Get('sensitive-operation')
 * @UseCustomGuard('businessHours', 'Only available during business hours')
 * async sensitiveOperation() {
 *   // Only accessible during business hours (9 AM - 5 PM)
 * }
 *
 * @Get('user/:userId/private-data')
 * @UseCustomGuard('resourceOwner', 'Access own data or admin override')
 * async getPrivateData(@Param('userId') userId: string, @CurrentUser() user: User) {
 *   // Only accessible by the resource owner or admin
 * }
 * \`\`\`
 *
 * @see GuardHelper.registerGuard For registering custom guards
 * @see GuardHelper.createTimeBasedGuard For time-based access control
 * @see GuardHelper.createOwnershipGuard For resource ownership validation
 *
 * @since 1.0.0
 */
export function UseCustomGuard(
  guardName: string,
  description?: string,
): MethodDecorator {
  return SecureEndpoint({
    description: description || `Protected by ${guardName} guard`,
  });
}
