import type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  EnhancedPaginationQuery,
} from '../types/generics';
import { ResponseStatus, ResponseCodes } from '../types/enums';

/**
 * Comprehensive response formatting utility with enhanced type safety
 *
 * @description Provides standardized response formatting for APIs with consistent
 * structure, error handling, and metadata support. Includes automatic request ID
 * generation and timestamp management for better traceability.
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get(':id')
 *   async getUser(@Param('id') id: string): Promise<ApiResponse<User>> {
 *     const user = await this.userService.findById(id);
 *     if (!user) {
 *       return ResponseFormatter.notFound('User');
 *     }
 *     return ResponseFormatter.success(user, 'User retrieved successfully');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export class ResponseFormatter {
  /**
   * Generate a unique request identifier for tracing
   *
   * @description Creates a unique request ID that can be used for request tracing,
   * logging correlation, and debugging across distributed systems.
   *
   * @returns {string} Unique request identifier in format "req_{timestamp}_{random}"
   *
   * @private
   *
   * @example
   * ```typescript
   * const requestId = ResponseFormatter.generateRequestId();
   * // Returns: "req_1703123456789_abc123def"
   * ```
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current ISO timestamp string
   *
   * @description Returns the current date and time as an ISO 8601 string
   * for consistent timestamp formatting across all responses.
   *
   * @returns {string} Current timestamp in ISO 8601 format
   *
   * @private
   *
   * @example
   * ```typescript
   * const timestamp = ResponseFormatter.getTimestamp();
   * // Returns: "2024-01-15T10:30:45.123Z"
   * ```
   */
  private static getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Create a successful response with generic type support
   *
   * @description Formats a successful API response with the provided data, optional
   * message, and metadata. Automatically includes success indicators, timestamps,
   * and request tracing information.
   *
   * @template T - Type of the response data
   *
   * @param data - The response data to include
   * @param message - Optional success message for the client
   * @param metadata - Optional additional metadata to include
   *
   * @returns {ApiResponse<T>} Formatted success response
   *
   * @example
   * ```typescript
   * interface User {
   *   id: string;
   *   name: string;
   *   email: string;
   * }
   *
   * // Simple success response
   * const response = ResponseFormatter.success<User>(
   *   { id: '123', name: 'John', email: 'john@example.com' },
   *   'User retrieved successfully'
   * );
   *
   * // Success response with metadata
   * const responseWithMeta = ResponseFormatter.success<User[]>(
   *   users,
   *   'Users retrieved successfully',
   *   {
   *     source: 'database',
   *     cached: false,
   *     executionTime: '45ms'
   *   }
   * );
   *
   * // Response structure:
   * // {
   * //   success: true,
   * //   status: "success",
   * //   code: "OPERATION_SUCCESSFUL",
   * //   data: { ... },
   * //   message: "User retrieved successfully",
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def",
   * //   metadata: { ... }
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static success<T>(
    data: T,
    message?: string,
    metadata?: Record<string, any>,
  ): ApiResponse<T> {
    return {
      success: true,
      status: ResponseStatus.SUCCESS,
      code: ResponseCodes.OPERATION_SUCCESSFUL,
      data,
      message,
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
      metadata,
    };
  }

  /**
   * Create an error response with enhanced error information
   *
   * @description Formats an error response with detailed error information,
   * error codes, and optional field-specific details for validation errors.
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code (defaults to INTERNAL_ERROR)
   * @param details - Additional error details or context
   * @param field - Specific field name if this is a field-level error
   *
   * @returns {ErrorResponse} Formatted error response
   *
   * @example
   * ```typescript
   * // Generic error
   * const error = ResponseFormatter.error(
   *   'Something went wrong',
   *   ResponseCodes.INTERNAL_ERROR
   * );
   *
   * // Validation error with field details
   * const validationError = ResponseFormatter.error(
   *   'Invalid email format',
   *   ResponseCodes.VALIDATION_FAILED,
   *   { pattern: '^[^@]+@[^@]+\.[^@]+$' },
   *   'email'
   * );
   *
   * // Error with additional context
   * const contextError = ResponseFormatter.error(
   *   'Database connection failed',
   *   ResponseCodes.EXTERNAL_SERVICE_ERROR,
   *   {
   *     service: 'postgresql',
   *     host: 'db.example.com',
   *     retryable: true
   *   }
   * );
   *
   * // Response structure:
   * // {
   * //   success: false,
   * //   status: "error",
   * //   code: "VALIDATION_FAILED",
   * //   error: {
   * //     message: "Invalid email format",
   * //     details: { pattern: "^[^@]+@[^@]+\.[^@]+$" },
   * //     field: "email"
   * //   },
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def"
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static error(
    message: string,
    code: ResponseCodes = ResponseCodes.INTERNAL_ERROR,
    details?: any,
    field?: string,
  ): ErrorResponse {
    return {
      success: false,
      status: ResponseStatus.ERROR,
      code,
      error: {
        message,
        details,
        field,
      },
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Create a warning response with data and warning message
   *
   * @description Formats a response that succeeded but has warnings or important
   * information that the client should be aware of. Useful for deprecated features,
   * partial failures, or advisory messages.
   *
   * @template T - Type of the response data
   *
   * @param data - The response data to include
   * @param message - Warning message for the client
   * @param code - Response code (defaults to OPERATION_SUCCESSFUL)
   * @param metadata - Optional additional metadata
   *
   * @returns {ApiResponse<T>} Formatted warning response
   *
   * @example
   * ```typescript
   * // API deprecation warning
   * const deprecatedResponse = ResponseFormatter.warning(
   *   userData,
   *   'This endpoint is deprecated and will be removed in v2.0',
   *   ResponseCodes.OPERATION_SUCCESSFUL,
   *   {
   *     deprecationDate: '2024-06-01',
   *     migrationGuide: '/docs/migration-v2'
   *   }
   * );
   *
   * // Partial success warning
   * const partialResponse = ResponseFormatter.warning(
   *   { processed: 8, failed: 2 },
   *   'Some items could not be processed',
   *   ResponseCodes.OPERATION_SUCCESSFUL,
   *   {
   *     failedItems: ['item9', 'item10'],
   *     reason: 'validation_failed'
   *   }
   * );
   *
   * // Response structure:
   * // {
   * //   success: true,
   * //   status: "warning",
   * //   code: "OPERATION_SUCCESSFUL",
   * //   data: { ... },
   * //   message: "This endpoint is deprecated...",
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def",
   * //   metadata: { ... }
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static warning<T>(
    data: T,
    message: string,
    code: ResponseCodes = ResponseCodes.OPERATION_SUCCESSFUL,
    metadata?: Record<string, any>,
  ): ApiResponse<T> {
    return {
      success: true,
      status: ResponseStatus.WARNING,
      code,
      data,
      message,
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
      metadata,
    };
  }

  /**
   * Create a paginated response with enhanced pagination metadata
   *
   * @description Formats a paginated response with comprehensive pagination
   * information including navigation indicators and total counts.
   *
   * @template T - Type of the items in the data array
   *
   * @param data - Array of items for the current page
   * @param total - Total number of items across all pages
   * @param page - Current page number (1-based)
   * @param limit - Number of items per page
   * @param message - Optional message about the pagination result
   *
   * @returns {PaginatedResponse<T>} Formatted paginated response
   *
   * @example
   * ```typescript
   * // Basic pagination
   * const users = await userService.findMany({ skip: 20, take: 10 });
   * const totalUsers = await userService.count();
   *
   * const paginatedResponse = ResponseFormatter.paginated(
   *   users,
   *   totalUsers,
   *   3, // page 3
   *   10, // 10 items per page
   *   'Users retrieved successfully'
   * );
   *
   * // Response structure:
   * // {
   * //   data: [...], // 10 user objects
   * //   pagination: {
   * //     total: 156,
   * //     page: 3,
   * //     limit: 10,
   * //     totalPages: 16,
   * //     hasNext: true,
   * //     hasPrevious: true
   * //   },
   * //   status: "success",
   * //   timestamp: "2024-01-15T10:30:45.123Z"
   * // }
   *
   * // Use with pagination helper
   * const pagination = { page: 2, limit: 25 };
   * const { skip, take } = PaginationHelper.getSkipTake(pagination);
   * const items = await service.findMany({ skip, take });
   * const total = await service.count();
   *
   * return ResponseFormatter.paginated(items, total, pagination.page, pagination.limit);
   * ```
   *
   * @since 1.0.0
   */
  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
      },
      status: ResponseStatus.SUCCESS,
      timestamp: this.getTimestamp(),
      message,
    };
  }

  /**
   * Create a validation error response with detailed field errors
   *
   * @description Formats validation errors with field-specific error messages
   * and values. Commonly used with class-validator or custom validation logic.
   *
   * @param errors - Array of field validation errors
   * @param errors[].field - Name of the field that failed validation
   * @param errors[].message - Human-readable error message for the field
   * @param errors[].value - Optional invalid value that was provided
   *
   * @returns {ErrorResponse} Formatted validation error response
   *
   * @example
   * ```typescript
   * // Single field validation error
   * const emailError = ResponseFormatter.validationError([
   *   {
   *     field: 'email',
   *     message: 'Email must be a valid email address',
   *     value: 'invalid-email'
   *   }
   * ]);
   *
   * // Multiple field validation errors
   * const multipleErrors = ResponseFormatter.validationError([
   *   {
   *     field: 'email',
   *     message: 'Email is required',
   *     value: undefined
   *   },
   *   {
   *     field: 'password',
   *     message: 'Password must be at least 8 characters',
   *     value: '123'
   *   },
   *   {
   *     field: 'age',
   *     message: 'Age must be between 18 and 120',
   *     value: 150
   *   }
   * ]);
   *
   * // Integration with class-validator
   * import { validate } from 'class-validator';
   *
   * const validationErrors = await validate(dto);
   * if (validationErrors.length > 0) {
   *   const errors = validationErrors.map(error => ({
   *     field: error.property,
   *     message: Object.values(error.constraints || {}).join(', '),
   *     value: error.value
   *   }));
   *   return ResponseFormatter.validationError(errors);
   * }
   *
   * // Response structure:
   * // {
   * //   success: false,
   * //   status: "error",
   * //   code: "VALIDATION_FAILED",
   * //   error: {
   * //     message: "Validation failed",
   * //     details: [
   * //       { field: "email", message: "Email is required", value: undefined },
   * //       { field: "password", message: "Password must be...", value: "123" }
   * //     ]
   * //   },
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def"
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static validationError(
    errors: Array<{ field: string; message: string; value?: any }>,
  ): ErrorResponse {
    return {
      success: false,
      status: ResponseStatus.ERROR,
      code: ResponseCodes.VALIDATION_FAILED,
      error: {
        message: 'Validation failed',
        details: errors,
      },
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Create an authentication error response
   *
   * @description Formats a standardized authentication error response for
   * scenarios where authentication is required but not provided or invalid.
   *
   * @param message - Custom authentication error message (defaults to "Authentication required")
   *
   * @returns {ErrorResponse} Formatted authentication error response
   *
   * @example
   * ```typescript
   * // Default authentication error
   * const authError = ResponseFormatter.authenticationError();
   *
   * // Custom authentication error message
   * const customAuthError = ResponseFormatter.authenticationError(
   *   'Your session has expired. Please log in again.'
   * );
   *
   * // Usage in guards or middleware
   * @Injectable()
   * export class JwtAuthGuard implements CanActivate {
   *   canActivate(context: ExecutionContext): boolean {
   *     const request = context.switchToHttp().getRequest();
   *     const token = request.headers.authorization;
   *
   *     if (!token) {
   *       throw new UnauthorizedException(
   *         ResponseFormatter.authenticationError('No authentication token provided')
   *       );
   *     }
   *
   *     // Validate token...
   *   }
   * }
   *
   * // Response structure:
   * // {
   * //   success: false,
   * //   status: "error",
   * //   code: "AUTHENTICATION_REQUIRED",
   * //   error: {
   * //     message: "Authentication required"
   * //   },
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def"
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static authenticationError(
    message = 'Authentication required',
  ): ErrorResponse {
    return {
      success: false,
      status: ResponseStatus.ERROR,
      code: ResponseCodes.AUTHENTICATION_REQUIRED,
      error: {
        message,
      },
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Create an authorization error response
   *
   * @description Formats a standardized authorization error response for
   * scenarios where the user is authenticated but lacks sufficient permissions.
   *
   * @param message - Custom authorization error message (defaults to "Insufficient permissions")
   *
   * @returns {ErrorResponse} Formatted authorization error response
   *
   * @example
   * ```typescript
   * // Default authorization error
   * const authzError = ResponseFormatter.authorizationError();
   *
   * // Custom authorization error with specific details
   * const customAuthzError = ResponseFormatter.authorizationError(
   *   'You need admin privileges to access this resource'
   * );
   *
   * // Usage in role-based guards
   * @Injectable()
   * export class RolesGuard implements CanActivate {
   *   canActivate(context: ExecutionContext): boolean {
   *     const requiredRoles = this.reflector.get('roles', context.getHandler());
   *     const user = context.switchToHttp().getRequest().user;
   *
   *     if (!user.roles.some(role => requiredRoles.includes(role))) {
   *       throw new ForbiddenException(
   *         ResponseFormatter.authorizationError(
   *           `Requires one of: ${requiredRoles.join(', ')}`
   *         )
   *       );
   *     }
   *
   *     return true;
   *   }
   * }
   *
   * // Response structure:
   * // {
   * //   success: false,
   * //   status: "error",
   * //   code: "AUTHORIZATION_FAILED",
   * //   error: {
   * //     message: "Insufficient permissions"
   * //   },
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def"
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static authorizationError(
    message = 'Insufficient permissions',
  ): ErrorResponse {
    return {
      success: false,
      status: ResponseStatus.ERROR,
      code: ResponseCodes.AUTHORIZATION_FAILED,
      error: {
        message,
      },
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Create a not found error response
   *
   * @description Formats a standardized 404 error response for scenarios where
   * a requested resource cannot be found.
   *
   * @template T - Type hint for the missing resource (not used in response)
   *
   * @param resource - Optional name of the resource that was not found
   *
   * @returns {ErrorResponse} Formatted not found error response
   *
   * @example
   * ```typescript
   * // Generic not found error
   * const notFound = ResponseFormatter.notFound();
   *
   * // Specific resource not found
   * const userNotFound = ResponseFormatter.notFound('User');
   * const orderNotFound = ResponseFormatter.notFound<Order>('Order');
   *
   * // Usage in service methods
   * @Injectable()
   * export class UserService {
   *   async findById(id: string): Promise<ApiResponse<User> | ErrorResponse> {
   *     const user = await this.userRepository.findById(id);
   *
   *     if (!user) {
   *       return ResponseFormatter.notFound('User');
   *     }
   *
   *     return ResponseFormatter.success(user);
   *   }
   * }
   *
   * // Usage in controllers
   * @Get(':id')
   * async getUser(@Param('id') id: string) {
   *   const user = await this.userService.findById(id);
   *   if (!user) {
   *     throw new NotFoundException(ResponseFormatter.notFound('User'));
   *   }
   *   return ResponseFormatter.success(user);
   * }
   *
   * // Response structure:
   * // {
   * //   success: false,
   * //   status: "error",
   * //   code: "RESOURCE_NOT_FOUND",
   * //   error: {
   * //     message: "User not found"
   * //   },
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def"
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static notFound<T = any>(resource?: string): ErrorResponse {
    const message = resource ? `${resource} not found` : 'Resource not found';
    return {
      success: false,
      status: ResponseStatus.ERROR,
      code: ResponseCodes.RESOURCE_NOT_FOUND,
      error: {
        message,
      },
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Create a conflict error response
   *
   * @description Formats a standardized 409 conflict error response for scenarios
   * where the request conflicts with the current state of the resource.
   *
   * @param message - Conflict error message (defaults to "Resource conflict")
   *
   * @returns {ErrorResponse} Formatted conflict error response
   *
   * @example
   * ```typescript
   * // Generic conflict error
   * const conflict = ResponseFormatter.conflict();
   *
   * // Specific conflict scenarios
   * const emailConflict = ResponseFormatter.conflict(
   *   'Email address is already registered'
   * );
   *
   * const versionConflict = ResponseFormatter.conflict(
   *   'Resource has been modified by another user'
   * );
   *
   * // Usage in service methods
   * @Injectable()
   * export class UserService {
   *   async createUser(userData: CreateUserDto): Promise<ApiResponse<User> | ErrorResponse> {
   *     const existingUser = await this.userRepository.findByEmail(userData.email);
   *
   *     if (existingUser) {
   *       return ResponseFormatter.conflict('Email address is already registered');
   *     }
   *
   *     const user = await this.userRepository.create(userData);
   *     return ResponseFormatter.success(user, 'User created successfully');
   *   }
   * }
   *
   * // Optimistic locking example
   * async updateUser(id: string, updateData: UpdateUserDto, version: number) {
   *   const user = await this.userRepository.findById(id);
   *
   *   if (user.version !== version) {
   *     throw new ConflictException(
   *       ResponseFormatter.conflict('Resource has been modified by another user')
   *     );
   *   }
   *
   *   // Proceed with update...
   * }
   *
   * // Response structure:
   * // {
   * //   success: false,
   * //   status: "error",
   * //   code: "RESOURCE_CONFLICT",
   * //   error: {
   * //     message: "Email address is already registered"
   * //   },
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def"
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static conflict(message = 'Resource conflict'): ErrorResponse {
    return {
      success: false,
      status: ResponseStatus.ERROR,
      code: ResponseCodes.RESOURCE_CONFLICT,
      error: {
        message,
      },
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Create a rate limit exceeded error response
   *
   * @description Formats a standardized 429 rate limit error response for scenarios
   * where the client has exceeded the allowed request rate.
   *
   * @param message - Rate limit error message (defaults to "Rate limit exceeded")
   *
   * @returns {ErrorResponse} Formatted rate limit error response
   *
   * @example
   * ```typescript
   * // Default rate limit error
   * const rateLimitError = ResponseFormatter.rateLimitExceeded();
   *
   * // Custom rate limit message with details
   * const customRateLimitError = ResponseFormatter.rateLimitExceeded(
   *   'Too many login attempts. Please try again in 15 minutes.'
   * );
   *
   * // Usage in rate limiting guards
   * @Injectable()
   * export class RateLimitGuard implements CanActivate {
   *   canActivate(context: ExecutionContext): boolean {
   *     const request = context.switchToHttp().getRequest();
   *     const clientIp = request.ip;
   *
   *     if (this.isRateLimited(clientIp)) {
   *       throw new HttpException(
   *         ResponseFormatter.rateLimitExceeded(
   *           'Too many requests from this IP. Please try again later.'
   *         ),
   *         HttpStatus.TOO_MANY_REQUESTS
   *       );
   *     }
   *
   *     return true;
   *   }
   * }
   *
   * // Usage with specific limits
   * const loginRateLimit = ResponseFormatter.rateLimitExceeded(
   *   'Maximum 5 login attempts per minute exceeded'
   * );
   *
   * const apiRateLimit = ResponseFormatter.rateLimitExceeded(
   *   'API rate limit of 1000 requests per hour exceeded'
   * );
   *
   * // Response structure:
   * // {
   * //   success: false,
   * //   status: "error",
   * //   code: "RATE_LIMIT_EXCEEDED",
   * //   error: {
   * //     message: "Rate limit exceeded"
   * //   },
   * //   timestamp: "2024-01-15T10:30:45.123Z",
   * //   requestId: "req_1703123456789_abc123def"
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static rateLimitExceeded(message = 'Rate limit exceeded'): ErrorResponse {
    return {
      success: false,
      status: ResponseStatus.ERROR,
      code: ResponseCodes.RATE_LIMIT_EXCEEDED,
      error: {
        message,
      },
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
    };
  }

  /**
   * Create a custom response with full control over all properties
   *
   * @description Provides complete control over response formatting when the
   * standard methods don't meet specific requirements. Allows custom status,
   * codes, and metadata while maintaining consistent structure.
   *
   * @template T - Type of the response data
   *
   * @param success - Whether the operation was successful
   * @param status - Response status indicator
   * @param code - Machine-readable response code
   * @param data - Optional response data
   * @param message - Optional human-readable message
   * @param metadata - Optional additional metadata
   *
   * @returns {ApiResponse<T>} Fully customized response
   *
   * @example
   * ```typescript
   * // Custom success response with specific code
   * const customSuccess = ResponseFormatter.custom(
   *   true,
   *   ResponseStatus.SUCCESS,
   *   ResponseCodes.OPERATION_SUCCESSFUL,
   *   { processedItems: 150 },
   *   'Batch processing completed',
   *   {
   *     processingTime: '2.3s',
   *     batchId: 'batch_123',
   *     skippedItems: 5
   *   }
   * );
   *
   * // Custom warning response
   * const customWarning = ResponseFormatter.custom(
   *   true,
   *   ResponseStatus.WARNING,
   *   ResponseCodes.OPERATION_SUCCESSFUL,
   *   { migrated: 95, failed: 5 },
   *   'Migration completed with some failures',
   *   {
   *     failureReason: 'data_validation_errors',
   *     retryable: true
   *   }
   * );
   *
   * // Custom error with specific business code
   * const businessError = ResponseFormatter.custom(
   *   false,
   *   ResponseStatus.ERROR,
   *   'INSUFFICIENT_BALANCE' as ResponseCodes, // Custom business code
   *   undefined,
   *   'Transaction failed due to insufficient account balance',
   *   {
   *     currentBalance: 150.00,
   *     requiredAmount: 200.00,
   *     accountId: 'acc_123'
   *   }
   * );
   *
   * // Async operation status
   * const asyncStatus = ResponseFormatter.custom(
   *   true,
   *   ResponseStatus.INFO,
   *   ResponseCodes.OPERATION_SUCCESSFUL,
   *   { jobId: 'job_456', status: 'processing' },
   *   'Job submitted successfully',
   *   {
   *     estimatedCompletion: '2024-01-15T11:00:00Z',
   *     statusUrl: '/api/jobs/job_456/status'
   *   }
   * );
   * ```
   *
   * @since 1.0.0
   */
  static custom<T>(
    success: boolean,
    status: ResponseStatus,
    code: ResponseCodes,
    data?: T,
    message?: string,
    metadata?: Record<string, any>,
  ): ApiResponse<T> {
    return {
      success,
      status,
      code,
      data,
      message,
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
      metadata,
    };
  }

  /**
   * Transform any data into a standardized API response
   *
   * @description Converts arbitrary data into a standardized API response format
   * with optional configuration. Useful for wrapping existing data or integrating
   * with legacy systems.
   *
   * @template T - Type of the data being transformed
   *
   * @param data - The data to transform into a response
   * @param options - Optional configuration for the transformation
   * @param options.message - Custom message for the response
   * @param options.status - Custom status (defaults to SUCCESS)
   * @param options.code - Custom response code (defaults to OPERATION_SUCCESSFUL)
   * @param options.metadata - Additional metadata to include
   *
   * @returns {ApiResponse<T>} Standardized API response
   *
   * @example
   * ```typescript
   * // Transform simple data
   * const userData = { id: '123', name: 'John' };
   * const response = ResponseFormatter.transform(userData);
   *
   * // Transform with custom message
   * const responseWithMessage = ResponseFormatter.transform(
   *   userData,
   *   { message: 'User data retrieved from cache' }
   * );
   *
   * // Transform with full options
   * const fullResponse = ResponseFormatter.transform(
   *   processedData,
   *   {
   *     message: 'Data processing completed',
   *     status: ResponseStatus.SUCCESS,
   *     code: ResponseCodes.OPERATION_SUCCESSFUL,
   *     metadata: {
   *       processingTime: '1.2s',
   *       source: 'batch_processor',
   *       version: '2.1.0'
   *     }
   *   }
   * );
   *
   * // Transform legacy API responses
   * const legacyData = await legacyApiCall();
   * return ResponseFormatter.transform(
   *   legacyData,
   *   {
   *     message: 'Legacy data retrieved and normalized',
   *     metadata: {
   *       legacyVersion: '1.0',
   *       normalized: true
   *     }
   *   }
   * );
   *
   * // Middleware usage
   * @Injectable()
   * export class ResponseTransformInterceptor implements NestInterceptor {
   *   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
   *     return next.handle().pipe(
   *       map(data => ResponseFormatter.transform(data, {
   *         message: 'Request processed successfully'
   *       }))
   *     );
   *   }
   * }
   * ```
   *
   * @since 1.0.0
   */
  static transform<T>(
    data: T,
    options?: {
      message?: string;
      status?: ResponseStatus;
      code?: ResponseCodes;
      metadata?: Record<string, any>;
    },
  ): ApiResponse<T> {
    const {
      message,
      status = ResponseStatus.SUCCESS,
      code = ResponseCodes.OPERATION_SUCCESSFUL,
      metadata,
    } = options || {};

    return {
      success: true,
      status,
      code,
      data,
      message,
      timestamp: this.getTimestamp(),
      requestId: this.generateRequestId(),
      metadata,
    };
  }
}

/**
 * Enhanced pagination helper with comprehensive database integration support
 *
 * @description Provides utilities for handling pagination logic, database queries,
 * link generation, validation, and integration with popular ORMs. Supports both
 * offset-based and cursor-based pagination patterns.
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   async getUsers(@Pagination() pagination: EnhancedPaginationQuery) {
 *     const { skip, take } = PaginationHelper.getSkipTake(pagination);
 *     const users = await this.userService.findMany({ skip, take });
 *     const total = await this.userService.count();
 *
 *     return PaginationHelper.paginate(users, total, pagination);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export class PaginationHelper {
  /**
   * Create a paginated response with enhanced metadata
   *
   * @description Formats data into a paginated response with comprehensive metadata
   * including navigation indicators, search terms, filters, and sorting information.
   *
   * @template T - Type of the items in the data array
   *
   * @param data - Array of items for the current page
   * @param total - Total number of items across all pages
   * @param pagination - Pagination query parameters
   * @param message - Optional message about the pagination result
   *
   * @returns {PaginatedResponse<T>} Formatted paginated response with metadata
   *
   * @example
   * ```typescript
   * // Basic pagination
   * const users = await userRepository.find({ skip: 20, take: 10 });
   * const totalUsers = await userRepository.count();
   * const pagination = { page: 3, limit: 10, sortBy: 'name', sortOrder: SortOrder.ASC };
   *
   * const response = PaginationHelper.paginate(
   *   users,
   *   totalUsers,
   *   pagination,
   *   'Users retrieved successfully'
   * );
   *
   * // With search and filters
   * const searchPagination = {
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'createdAt',
   *   sortOrder: SortOrder.DESC,
   *   search: 'john',
   *   filters: { department: 'engineering', active: true }
   * };
   *
   * const searchResponse = PaginationHelper.paginate(
   *   searchResults,
   *   searchTotal,
   *   searchPagination,
   *   'Search results retrieved'
   * );
   *
   * // Response includes comprehensive metadata:
   * // {
   * //   data: [...],
   * //   pagination: {
   * //     total: 156,
   * //     page: 3,
   * //     limit: 10,
   * //     totalPages: 16,
   * //     hasNext: true,
   * //     hasPrevious: true,
   * //     offset: 20,
   * //     sortBy: 'name',
   * //     sortOrder: 'ASC',
   * //     search: 'john',
   * //     filters: { department: 'engineering' }
   * //   },
   * //   status: 'success',
   * //   timestamp: '2024-01-15T10:30:45.123Z'
   * // }
   * ```
   *
   * @since 1.0.0
   */
  static paginate<T>(
    data: T[],
    total: number,
    pagination: EnhancedPaginationQuery,
    message?: string,
  ): PaginatedResponse<T> {
    const { page, limit, sortBy, sortOrder, search, filters, offset } =
      pagination;

    const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);
    const hasNext = limit === -1 ? false : page < totalPages;
    const hasPrevious = page > 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrevious,
        offset,
        sortBy,
        sortOrder,
        search,
        filters,
      },
      status: ResponseStatus.SUCCESS,
      timestamp: new Date().toISOString(),
      message,
    };
  }

  /**
   * Get skip and take values for database queries
   *
   * @description Calculates skip (offset) and take (limit) values for database
   * queries based on pagination parameters. Handles unlimited results correctly.
   *
   * @param pagination - Pagination query parameters
   *
   * @returns Object with skip and take values for database queries
   *
   * @example
   * ```typescript
   * // Standard pagination
   * const pagination = { page: 3, limit: 20 };
   * const { skip, take } = PaginationHelper.getSkipTake(pagination);
   * // Result: { skip: 40, take: 20 }
   *
   * // Unlimited results
   * const unlimitedPagination = { page: 1, limit: -1 };
   * const { skip: skipUnlimited, take: takeUnlimited } = PaginationHelper.getSkipTake(unlimitedPagination);
   * // Result: { skip: 0, take: -1 }
   *
   * // Usage with database queries
   * const { skip, take } = PaginationHelper.getSkipTake(pagination);
   * const users = await userRepository.find({
   *   skip,
   *   take: take === -1 ? undefined : take, // Handle unlimited for some ORMs
   *   order: { [pagination.sortBy]: pagination.sortOrder }
   * });
   * ```
   *
   * @since 1.0.0
   */
  static getSkipTake(pagination: EnhancedPaginationQuery): {
    skip: number;
    take: number;
  } {
    const { page, limit } = pagination;

    if (limit === -1) {
      return { skip: 0, take: -1 }; // Unlimited
    }

    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  /**
   * Get offset and limit values for SQL queries
   *
   * @description Calculates offset and limit values for raw SQL queries or
   * SQL query builders. Provides the same functionality as getSkipTake but
   * with SQL-standard naming.
   *
   * @param pagination - Pagination query parameters
   *
   * @returns Object with offset and limit values for SQL queries
   *
   * @example
   * ```typescript
   * const pagination = { page: 2, limit: 25 };
   * const { offset, limit } = PaginationHelper.getOffsetLimit(pagination);
   * // Result: { offset: 25, limit: 25 }
   *
   * // Usage with raw SQL
   * const { offset, limit } = PaginationHelper.getOffsetLimit(pagination);
   * const query = `
   *   SELECT * FROM users
   *   WHERE active = true
   *   ORDER BY created_at DESC
   *   LIMIT ${limit === -1 ? 'ALL' : limit}
   *   OFFSET ${offset}
   * `;
   *
   * // Usage with query builder
   * const queryBuilder = this.dataSource
   *   .createQueryBuilder('user')
   *   .where('user.active = :active', { active: true })
   *   .orderBy('user.createdAt', pagination.sortOrder);
   *
   * if (limit !== -1) {
   *   queryBuilder.limit(limit).offset(offset);
   * }
   *
   * const users = await queryBuilder.getMany();
   * ```
   *
   * @since 1.0.0
   */
  static getOffsetLimit(pagination: EnhancedPaginationQuery): {
    offset: number;
    limit: number;
  } {
    const { page, limit } = pagination;

    if (limit === -1) {
      return { offset: 0, limit: -1 }; // Unlimited
    }

    const offset = (page - 1) * limit;
    return { offset, limit };
  }

  /**
   * Create pagination links for APIs
   */
  static createLinks(
    pagination: EnhancedPaginationQuery,
    total: number,
    baseUrl: string,
  ): {
    first: string;
    last: string;
    prev?: string;
    next?: string;
    self: string;
  } {
    const { page, limit, sortBy, sortOrder, search, filters } = pagination;

    const totalPages = limit === -1 ? 1 : Math.ceil(total / limit);

    const buildUrl = (targetPage: number) => {
      const params = new URLSearchParams();
      params.set('page', targetPage.toString());
      params.set('limit', limit.toString());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      if (search) params.set('search', search);
      if (filters) params.set('filters', JSON.stringify(filters));

      return `${baseUrl}?${params.toString()}`;
    };

    const links = {
      first: buildUrl(1),
      last: buildUrl(totalPages),
      self: buildUrl(page),
    };

    if (page > 1) {
      (links as any).prev = buildUrl(page - 1);
    }

    if (page < totalPages && limit !== -1) {
      (links as any).next = buildUrl(page + 1);
    }

    return links;
  }

  /**
   * Validate pagination parameters
   */
  static validate(
    pagination: EnhancedPaginationQuery,
    options: {
      maxLimit?: number;
      allowedSortFields?: string[];
      requireSearch?: boolean;
    } = {},
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { page, limit, sortBy, search } = pagination;

    // Validate page
    if (page < 1) {
      errors.push('Page must be greater than 0');
    }

    // Validate limit
    if (limit !== -1) {
      if (limit < 1) {
        errors.push('Limit must be greater than 0');
      }

      if (options.maxLimit && limit > options.maxLimit) {
        errors.push(`Limit cannot exceed ${options.maxLimit}`);
      }
    }

    // Validate sort field
    if (
      options.allowedSortFields &&
      !options.allowedSortFields.includes(sortBy)
    ) {
      errors.push(
        `Invalid sort field: ${sortBy}. Allowed fields: ${options.allowedSortFields.join(', ')}`,
      );
    }

    // Validate search requirement
    if (options.requireSearch && (!search || search.trim().length === 0)) {
      errors.push('Search parameter is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Transform pagination for different database ORMs
   */
  static forPrisma(pagination: EnhancedPaginationQuery) {
    const { skip, take } = this.getSkipTake(pagination);
    const { sortBy, sortOrder } = pagination;

    return {
      skip: skip,
      take: take === -1 ? undefined : take,
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
    };
  }

  static forTypeORM(pagination: EnhancedPaginationQuery) {
    const { skip, take } = this.getSkipTake(pagination);
    const { sortBy, sortOrder } = pagination;

    return {
      skip: skip,
      take: take === -1 ? undefined : take,
      order: {
        [sortBy]: sortOrder,
      },
    };
  }

  static forMongoose(pagination: EnhancedPaginationQuery) {
    const { skip, take } = this.getSkipTake(pagination);
    const { sortBy, sortOrder } = pagination;

    const sort = { [sortBy]: sortOrder === 'ASC' ? 1 : -1 };

    return {
      skip,
      limit: take === -1 ? 0 : take,
      sort,
    };
  }

  /**
   * Create cursor-based pagination
   */
  static createCursor<T>(
    data: T[],
    cursorField: keyof T,
    pagination: EnhancedPaginationQuery,
  ): {
    data: T[];
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string;
    previousCursor?: string;
  } {
    const { limit } = pagination;
    const hasNext = data.length > limit;
    const hasPrevious = false; // Would need additional logic for previous cursor

    // Remove extra item if we have more than requested
    const resultData = hasNext ? data.slice(0, limit) : data;

    const nextCursor =
      hasNext && resultData.length > 0
        ? String(resultData[resultData.length - 1][cursorField])
        : undefined;

    return {
      data: resultData,
      hasNext,
      hasPrevious,
      nextCursor,
    };
  }

  /**
   * Calculate pagination statistics
   */
  static getStats(pagination: EnhancedPaginationQuery, total: number) {
    const { page, limit } = pagination;

    if (limit === -1) {
      return {
        totalItems: total,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: total,
        startIndex: 1,
        endIndex: total,
        isFirstPage: true,
        isLastPage: true,
      };
    }

    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    return {
      totalItems: total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      startIndex,
      endIndex,
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
    };
  }
}
