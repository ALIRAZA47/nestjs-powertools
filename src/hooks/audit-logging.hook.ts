import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import type {
  AuditConfig,
  AuditLogEntry,
  AuditStorage,
  PaginatedResponse,
} from '../types/generics';
import {
  AuditAction,
  AuditLevel,
  LogContext,
  ResponseStatus,
} from '../types/enums';
import { PowertoolsConfigService } from '../config/powertools.config';
import * as fs from 'fs/promises';

/**
 * MongoDB-based audit storage implementation with generic type support
 *
 * @description Provides persistent audit log storage using MongoDB. Supports custom user
 * and metadata types for flexible audit data structures. Replace the placeholder
 * implementations with your actual MongoDB operations.
 *
 * @template TUser - Type of the user object being audited
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @example
 * ```typescript
 * interface CustomUser {
 *   id: string;
 *   email: string;
 *   department: string;
 * }
 *
 * interface CustomMetadata {
 *   sessionId: string;
 *   deviceInfo: string;
 *   businessContext: Record<string, any>;
 * }
 *
 * @Injectable()
 * export class CustomAuditStorage extends MongoAuditStorage<CustomUser, CustomMetadata> {
 *   constructor(@InjectModel('AuditLog') private auditModel: Model<AuditLogDocument>) {
 *     super();
 *   }
 *
 *   async save(entry: AuditLogEntry<CustomUser, CustomMetadata>): Promise<void> {
 *     await this.auditModel.create(entry);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class MongoAuditStorage<TUser = any, TMetadata = any>
  implements AuditStorage<AuditLogEntry<TUser, TMetadata>>
{
  private readonly logger = new Logger(MongoAuditStorage.name);

  /**
   * Save an audit log entry to MongoDB
   *
   * @description Persists an audit log entry to the MongoDB database. This is a placeholder
   * implementation that should be replaced with your actual MongoDB operations.
   *
   * @param entry - The audit log entry to save
   * @throws {Error} If the database operation fails
   *
   * @example
   * ```typescript
   * const auditEntry: AuditLogEntry<User, CustomMetadata> = {
   *   userId: 'user123',
   *   action: AuditAction.CREATE,
   *   resource: 'User',
   *   timestamp: new Date(),
   *   metadata: { sessionId: 'session123' }
   * };
   *
   * await auditStorage.save(auditEntry);
   * ```
   */
  async save(entry: AuditLogEntry<TUser, TMetadata>): Promise<void> {
    try {
      // Replace with your actual MongoDB implementation
      // Example: await this.auditModel.create(entry)
      this.logger.log(
        `Audit log saved: ${entry.action} by user ${entry.userId}`,
        LogContext.AUDIT,
      );
      console.log('Audit Entry:', JSON.stringify(entry, null, 2));
    } catch (error) {
      this.logger.error('Failed to save audit log', error, LogContext.AUDIT);
    }
  }

  /**
   * Find audit log entries with optional pagination
   *
   * @description Queries audit log entries based on filters with optional pagination support.
   * Returns a paginated response with metadata about the result set.
   *
   * @param filters - Partial audit log entry to filter by
   * @param pagination - Optional pagination parameters
   * @returns Promise resolving to paginated audit log entries
   *
   * @example
   * ```typescript
   * // Find all CREATE actions by a specific user
   * const result = await auditStorage.find(
   *   { userId: 'user123', action: AuditAction.CREATE },
   *   { page: 1, limit: 20 }
   * );
   *
   * console.log(`Found ${result.pagination.total} entries`);
   * result.data.forEach(entry => console.log(entry.action));
   * ```
   */
  async find(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
    pagination?: any,
  ): Promise<PaginatedResponse<AuditLogEntry<TUser, TMetadata>>> {
    // Replace with your actual MongoDB query with pagination
    return {
      data: [],
      pagination: {
        total: 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || 10,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
      status: ResponseStatus.SUCCESS,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Find a single audit log entry by ID
   *
   * @description Retrieves a specific audit log entry by its unique identifier.
   *
   * @param id - Unique identifier of the audit log entry
   * @returns Promise resolving to the audit log entry or null if not found
   *
   * @example
   * ```typescript
   * const entry = await auditStorage.findById('audit_123');
   * if (entry) {
   *   console.log(`Action: ${entry.action}, User: ${entry.userId}`);
   * }
   * ```
   */
  async findById(id: string): Promise<AuditLogEntry<TUser, TMetadata> | null> {
    // Replace with your actual MongoDB query
    return null;
  }

  /**
   * Count audit log entries matching the given filters
   *
   * @description Returns the total number of audit log entries that match the specified filters.
   * Useful for pagination calculations and statistics.
   *
   * @param filters - Partial audit log entry to filter by
   * @returns Promise resolving to the count of matching entries
   *
   * @example
   * ```typescript
   * const loginCount = await auditStorage.count({
   *   action: AuditAction.LOGIN,
   *   timestamp: { $gte: new Date('2024-01-01') }
   * });
   * console.log(`${loginCount} logins since January 1st`);
   * ```
   */
  async count(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
  ): Promise<number> {
    // Replace with your actual MongoDB count query
    return 0;
  }

  /**
   * Delete a single audit log entry by ID
   *
   * @description Removes a specific audit log entry from the database.
   * Use with caution as this permanently deletes audit data.
   *
   * @param id - Unique identifier of the audit log entry to delete
   * @returns Promise resolving to true if deleted, false if not found
   *
   * @example
   * ```typescript
   * const deleted = await auditStorage.delete('audit_123');
   * if (deleted) {
   *   console.log('Audit entry deleted successfully');
   * }
   * ```
   */
  async delete(id: string): Promise<boolean> {
    // Replace with your actual MongoDB delete
    return true;
  }

  /**
   * Delete multiple audit log entries matching the given filters
   *
   * @description Removes multiple audit log entries that match the specified filters.
   * Returns the number of entries that were deleted.
   *
   * @param filters - Partial audit log entry to filter entries for deletion
   * @returns Promise resolving to the number of deleted entries
   *
   * @example
   * ```typescript
   * // Delete all audit entries older than 1 year
   * const oneYearAgo = new Date();
   * oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
   *
   * const deletedCount = await auditStorage.deleteMany({
   *   timestamp: { $lt: oneYearAgo }
   * });
   * console.log(`Deleted ${deletedCount} old audit entries`);
   * ```
   */
  async deleteMany(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
  ): Promise<number> {
    // Replace with your actual MongoDB deleteMany
    return 0;
  }
}

/**
 * In-memory audit storage implementation for development and testing
 *
 * @description Provides temporary audit log storage in memory. Suitable for development,
 * testing, and scenarios where persistent storage is not required. Data is lost when
 * the application restarts.
 *
 * @template TUser - Type of the user object being audited
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @example
 * ```typescript
 * // Use in development or testing
 * const auditStorage = new InMemoryAuditStorage<User, TestMetadata>();
 *
 * // Save some test data
 * await auditStorage.save({
 *   userId: 'test-user',
 *   action: AuditAction.CREATE,
 *   resource: 'TestResource',
 *   timestamp: new Date()
 * });
 *
 * // Verify the data
 * const allLogs = auditStorage.getAllLogs();
 * console.log(`Stored ${allLogs.length} audit entries`);
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class InMemoryAuditStorage<TUser = any, TMetadata = any>
  implements AuditStorage<AuditLogEntry<TUser, TMetadata>>
{
  private logs: AuditLogEntry<TUser, TMetadata>[] = [];
  private readonly logger = new Logger(InMemoryAuditStorage.name);

  /**
   * Save an audit log entry to memory
   *
   * @description Stores an audit log entry in the in-memory array. Automatically
   * generates a unique ID for the entry.
   *
   * @param entry - The audit log entry to save
   *
   * @example
   * ```typescript
   * await inMemoryStorage.save({
   *   userId: 'user123',
   *   action: AuditAction.UPDATE,
   *   resource: 'Profile',
   *   timestamp: new Date(),
   *   metadata: { changedFields: ['name', 'email'] }
   * });
   * ```
   */
  async save(entry: AuditLogEntry<TUser, TMetadata>): Promise<void> {
    entry.id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.logs.push(entry);
    this.logger.log(
      `Audit log saved: ${entry.action} by user ${entry.userId}`,
      LogContext.AUDIT,
    );
  }

  /**
   * Find audit log entries with pagination support
   *
   * @description Searches through in-memory audit entries and returns paginated results.
   * Supports filtering by any audit log entry properties.
   *
   * @param filters - Partial audit log entry to filter by
   * @param pagination - Optional pagination parameters
   * @returns Promise resolving to paginated audit log entries
   *
   * @example
   * ```typescript
   * const userActions = await inMemoryStorage.find(
   *   { userId: 'user123' },
   *   { page: 1, limit: 10 }
   * );
   *
   * userActions.data.forEach(entry => {
   *   console.log(`${entry.action} on ${entry.resource}`);
   * });
   * ```
   */
  async find(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
    pagination?: any,
  ): Promise<PaginatedResponse<AuditLogEntry<TUser, TMetadata>>> {
    const filteredLogs = this.logs.filter((log) => {
      return Object.entries(filters).every(([key, value]) => {
        const logValue = log[key as keyof AuditLogEntry<TUser, TMetadata>];
        return logValue === value;
      });
    });

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredLogs.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        total: filteredLogs.length,
        page,
        limit,
        totalPages: Math.ceil(filteredLogs.length / limit),
        hasNext: endIndex < filteredLogs.length,
        hasPrevious: page > 1,
      },
      status: ResponseStatus.SUCCESS,
      timestamp: new Date().toISOString(),
    };
  }

  async findById(id: string): Promise<AuditLogEntry<TUser, TMetadata> | null> {
    return this.logs.find((log) => log.id === id) || null;
  }

  async count(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
  ): Promise<number> {
    return this.logs.filter((log) => {
      return Object.entries(filters).every(([key, value]) => {
        const logValue = log[key as keyof AuditLogEntry<TUser, TMetadata>];
        return logValue === value;
      });
    }).length;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.logs.findIndex((log) => log.id === id);
    if (index > -1) {
      this.logs.splice(index, 1);
      return true;
    }
    return false;
  }

  async deleteMany(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
  ): Promise<number> {
    const initialLength = this.logs.length;
    this.logs = this.logs.filter((log) => {
      return !Object.entries(filters).every(([key, value]) => {
        const logValue = log[key as keyof AuditLogEntry<TUser, TMetadata>];
        return logValue === value;
      });
    });
    return initialLength - this.logs.length;
  }

  /**
   * Get all audit log entries (for testing purposes)
   *
   * @description Returns a copy of all stored audit log entries. Useful for testing
   * and debugging. Should not be used in production with large datasets.
   *
   * @returns Array of all audit log entries
   *
   * @example
   * ```typescript
   * const allEntries = inMemoryStorage.getAllLogs();
   * console.log(`Total audit entries: ${allEntries.length}`);
   *
   * // Analyze actions
   * const actionCounts = allEntries.reduce((acc, entry) => {
   *   acc[entry.action] = (acc[entry.action] || 0) + 1;
   *   return acc;
   * }, {});
   * ```
   */
  getAllLogs(): AuditLogEntry<TUser, TMetadata>[] {
    return [...this.logs];
  }

  /**
   * Clear all audit log entries (for testing purposes)
   *
   * @description Removes all stored audit log entries from memory. Primarily used
   * for cleaning up between tests or resetting the audit state.
   *
   * @example
   * ```typescript
   * // Clean up after tests
   * afterEach(() => {
   *   inMemoryStorage.clearLogs();
   * });
   * ```
   */
  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * File-based audit storage implementation (JSON file)
 *
 * @template TUser - Type of the user object being audited
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @param filePath - Path to the JSON file for storing logs (default: './audit-logs.json')
 *
 * @example
 * const storage = new FileAuditStorage('./my-audit-logs.json');
 * await storage.save({ ... });
 *
 * @see AuditStorage for method details
 */
@Injectable()
export class FileAuditStorage<TUser = any, TMetadata = any>
  implements AuditStorage<AuditLogEntry<TUser, TMetadata>>
{
  private readonly logger = new Logger(FileAuditStorage.name);
  private filePath: string;

  /**
   * @param filePath Path to the JSON file for storing logs (default: './audit-logs.json')
   */
  constructor(filePath?: string) {
    this.filePath = filePath || './audit-logs.json';
  }

  /**
   * Save an audit log entry to the file
   * @param entry The audit log entry to save
   */
  async save(entry: AuditLogEntry<TUser, TMetadata>): Promise<void> {
    try {
      let logs: any[] = [];
      try {
        const data = await fs.readFile(this.filePath, 'utf-8');
        logs = JSON.parse(data);
      } catch {}
      logs.push(entry);
      await fs.writeFile(this.filePath, JSON.stringify(logs, null, 2));
      this.logger.log(`Audit log saved to file: ${this.filePath}`);
    } catch (error) {
      this.logger.error('Failed to save audit log to file', error);
    }
  }

  /**
   * Find audit log entries with optional filters and pagination
   * @param filters Filter object
   * @param pagination Pagination options { page, limit }
   * @returns PaginatedResponse of audit log entries
   */
  async find(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
    pagination?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<AuditLogEntry<TUser, TMetadata>>> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      let logs = JSON.parse(data) as AuditLogEntry<TUser, TMetadata>[];
      logs = logs.filter((log) =>
        Object.entries(filters).every(
          ([k, v]) => log[k as keyof AuditLogEntry<TUser, TMetadata>] === v,
        ),
      );
      // Pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const total = logs.length;
      const totalPages = Math.ceil(total / limit);
      const paged = logs.slice((page - 1) * limit, page * limit);
      return {
        data: paged,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
        status: ResponseStatus.SUCCESS,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
        status: ResponseStatus.SUCCESS,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Find a single audit log entry by ID
   * @param id The log entry ID
   * @returns The audit log entry or null
   */
  async findById(id: string): Promise<AuditLogEntry<TUser, TMetadata> | null> {
    const result = await this.find({});
    return result.data.find((log) => log.id === id) || null;
  }

  /**
   * Count audit log entries matching filters
   * @param filters Filter object
   * @returns Number of matching entries
   */
  async count(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
  ): Promise<number> {
    const result = await this.find(filters);
    return result.data.length;
  }

  /**
   * Delete a single audit log entry by ID
   * @param id The log entry ID
   * @returns True if deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      let logs = JSON.parse(data) as AuditLogEntry<TUser, TMetadata>[];
      const initialLength = logs.length;
      logs = logs.filter((log) => log.id !== id);
      await fs.writeFile(this.filePath, JSON.stringify(logs, null, 2));
      return logs.length < initialLength;
    } catch {
      return false;
    }
  }

  /**
   * Delete multiple audit log entries matching filters
   * @param filters Filter object
   * @returns Number of deleted entries
   */
  async deleteMany(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
  ): Promise<number> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      let logs = JSON.parse(data) as AuditLogEntry<TUser, TMetadata>[];
      const initialLength = logs.length;
      logs = logs.filter(
        (log) =>
          !Object.entries(filters).every(
            ([k, v]) => log[k as keyof AuditLogEntry<TUser, TMetadata>] === v,
          ),
      );
      await fs.writeFile(this.filePath, JSON.stringify(logs, null, 2));
      return initialLength - logs.length;
    } catch {
      return 0;
    }
  }
}

/**
 * Factory to get the correct AuditStorage based on config
 *
 * @returns AuditStorage instance (MongoAuditStorage or FileAuditStorage)
 *
 * @example
 * const storage = getAuditStorageFromConfig();
 * await storage.save({ ... });
 */
export function getAuditStorageFromConfig(): AuditStorage<any> {
  const configService = PowertoolsConfigService.getInstance();
  const auditConfig = configService.getFeatureConfig('audit') as any;
  const storage = auditConfig?.storage || {
    type: 'file',
    filePath: './audit-logs.json',
  };
  if (storage.type === 'mongodb' && storage.mongoUrl) {
    // TODO: Implement actual MongoDB logic here
    return new MongoAuditStorage();
  }
  return new FileAuditStorage(storage.filePath);
}

/**
 * Audit interceptor that automatically logs user actions
 *
 * @description NestJS interceptor that captures HTTP requests and responses to create
 * comprehensive audit logs. Supports custom user types, metadata, and conditional logging.
 * Integrates with the PowerTools configuration system for global settings.
 *
 * @template TUser - Type of the authenticated user object
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @example
 * ```typescript
 * // Global application setup
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_INTERCEPTOR,
 *       useClass: AuditInterceptor,
 *     },
 *     {
 *       provide: AuditStorage,
 *       useClass: MongoAuditStorage,
 *     }
 *   ],
 * })
 * export class AppModule {}
 *
 * // Or use on specific controllers/methods
 * @Controller('users')
 * @UseInterceptors(AuditInterceptor)
 * export class UserController {
 *   // All methods will be audited
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class AuditInterceptor<TUser = any, TMetadata = any>
  implements NestInterceptor
{
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly configService = PowertoolsConfigService.getInstance();

  constructor(
    private readonly auditStorage: AuditStorage<
      AuditLogEntry<TUser, TMetadata>
    >,
  ) {}

  /**
   * Intercept HTTP requests to create audit logs
   *
   * @description Main interceptor method that captures request/response data and creates
   * audit log entries. Handles both successful operations and errors, measuring execution
   * time and capturing relevant context information.
   *
   * @param context - NestJS execution context containing request/response information
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable that emits the response and handles audit logging
   *
   * @example
   * ```typescript
   * // The interceptor automatically captures:
   * // - User information from request.user
   * // - HTTP method and URL
   * // - Request body (if configured)
   * // - Response status and body (if configured)
   * // - Execution duration
   * // - IP address and user agent
   * // - Custom metadata from decorator configuration
   * ```
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.getAuditConfig(context);
    if (!auditConfig || !this.configService.isFeatureEnabled('audit')) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const user: TUser = request.user;

    // Check condition if provided
    if (auditConfig.condition && !auditConfig.condition(context, user)) {
      return next.handle();
    }

    const auditEntry: AuditLogEntry<TUser, TMetadata> = {
      userId: (user as any)?.id || (user as any)?.sub,
      user,
      action: auditConfig.action,
      resource:
        auditConfig.resource || this.extractResourceFromContext(context),
      resourceId: this.extractResourceId(request),
      level: auditConfig.level || AuditLevel.MEDIUM,
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      timestamp: new Date(),
      endpoint: request.url,
      method: request.method,
      requestBody: auditConfig.includeRequestBody
        ? this.sanitizeData(request.body, auditConfig.excludeFields)
        : undefined,
      metadata: auditConfig.customMetadata
        ? auditConfig.customMetadata(context, user)
        : ({} as TMetadata),
    };

    return next.handle().pipe(
      tap((response) => {
        auditEntry.duration = Date.now() - startTime;
        auditEntry.responseStatus = context
          .switchToHttp()
          .getResponse().statusCode;
        auditEntry.success = true;

        if (auditConfig.includeResponseBody) {
          auditEntry.metadata = {
            ...auditEntry.metadata,
            responseBody: this.sanitizeData(
              response,
              auditConfig.excludeFields,
            ),
          } as TMetadata;
        }

        this.auditStorage.save(auditEntry).catch((error) => {
          this.logger.error(
            'Failed to save audit log',
            error,
            LogContext.AUDIT,
          );
        });
      }),
      catchError((error) => {
        auditEntry.duration = Date.now() - startTime;
        auditEntry.responseStatus = error.status || 500;
        auditEntry.success = false;
        auditEntry.errorMessage = error.message;
        auditEntry.metadata = {
          ...auditEntry.metadata,
          error: error.message,
          stack: error.stack,
        } as TMetadata;

        this.auditStorage.save(auditEntry).catch((saveError) => {
          this.logger.error(
            'Failed to save audit log for error case',
            saveError,
            LogContext.AUDIT,
          );
        });

        return throwError(() => error);
      }),
    );
  }

  /**
   * Extract audit configuration from method metadata
   *
   * @description Retrieves audit configuration that was set by the @Audit decorator
   * or other audit-related decorators on the method being executed.
   *
   * @param context - NestJS execution context
   * @returns Audit configuration object or null if not configured
   *
   * @private
   */
  private getAuditConfig(
    context: ExecutionContext,
  ): AuditConfig<TUser, TMetadata> | null {
    const handler = context.getHandler();
    const auditConfig = Reflect.getMetadata('audit-config', handler);
    return auditConfig || null;
  }

  /**
   * Extract resource name from execution context
   *
   * @description Generates a resource identifier from the controller class name and
   * method name when no explicit resource is configured.
   *
   * @param context - NestJS execution context
   * @returns Resource identifier string (e.g., "UserController.createUser")
   *
   * @private
   */
  private extractResourceFromContext(context: ExecutionContext): string {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    return `${className}.${handlerName}`;
  }

  /**
   * Extract resource ID from request parameters
   *
   * @description Attempts to extract a resource identifier from common request
   * parameter names like 'id', 'userId', or from the request body.
   *
   * @param request - HTTP request object
   * @returns Resource ID string or undefined if not found
   *
   * @private
   */
  private extractResourceId(request: any): string | undefined {
    return request.params?.id || request.params?.userId || request.body?.id;
  }

  /**
   * Sanitize sensitive data from objects
   *
   * @description Removes or redacts sensitive fields from request/response data
   * before storing in audit logs. Combines global configuration with method-specific
   * exclusion rules.
   *
   * @param data - Object to sanitize
   * @param excludeFields - Additional fields to exclude beyond global configuration
   * @returns Sanitized copy of the data object
   *
   * @private
   *
   * @example
   * ```typescript
   * const sanitized = this.sanitizeData(
   *   { name: 'John', password: 'secret123', email: 'john@example.com' },
   *   ['password']
   * );
   * // Result: { name: 'John', password: '[REDACTED]', email: 'john@example.com' }
   * ```
   */
  private sanitizeData(data: any, excludeFields: string[] = []): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const globalConfig = this.configService.getFeatureConfig('audit');
    const defaultExcludeFields = globalConfig?.excludeFields || [
      'password',
      'token',
      'secret',
      'key',
    ];
    const fieldsToExclude = [...defaultExcludeFields, ...excludeFields];

    fieldsToExclude.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

/**
 * Generic audit decorator with full type safety
 *
 * @description Main decorator for configuring audit logging on controller methods.
 * Supports custom user and metadata types for comprehensive audit trail creation.
 *
 * @template TUser - Type of the authenticated user object
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @param action - The audit action being performed (CREATE, READ, UPDATE, DELETE, etc.)
 * @param options - Additional configuration options for audit behavior
 * @param options.resource - Custom resource name (defaults to ClassName.methodName)
 * @param options.level - Audit level indicating importance (LOW, MEDIUM, HIGH, CRITICAL)
 * @param options.includeRequestBody - Whether to log the request body
 * @param options.includeResponseBody - Whether to log the response body
 * @param options.excludeFields - Additional fields to exclude from logging
 * @param options.customMetadata - Function to generate custom metadata
 * @param options.condition - Function to conditionally enable/disable auditing
 *
 * @returns {MethodDecorator} Decorator that configures audit logging
 *
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   email: string;
 *   department: string;
 * }
 *
 * interface OrderMetadata {
 *   orderValue: number;
 *   customerType: string;
 *   paymentMethod: string;
 * }
 *
 * @Post('orders')
 * @Audit<User, OrderMetadata>(AuditAction.CREATE, {
 *   resource: 'Order',
 *   level: AuditLevel.HIGH,
 *   includeRequestBody: true,
 *   excludeFields: ['creditCardNumber', 'cvv'],
 *   customMetadata: (context, user) => ({
 *     orderValue: context.switchToHttp().getRequest().body.amount,
 *     customerType: user.department === 'vip' ? 'premium' : 'standard',
 *     paymentMethod: context.switchToHttp().getRequest().body.paymentMethod
 *   }),
 *   condition: (context, user) => {
 *     // Only audit orders above $100 or for VIP customers
 *     const amount = context.switchToHttp().getRequest().body.amount;
 *     return amount > 100 || user.department === 'vip';
 *   }
 * })
 * async createOrder(@Body() orderData: CreateOrderDto, @CurrentUser() user: User) {
 *   // Method implementation
 * }
 * ```
 *
 * @since 1.0.0
 */
export const Audit = <TUser = any, TMetadata = any>(
  action: AuditAction | string,
  options: Omit<AuditConfig<TUser, TMetadata>, 'action'> = {},
): MethodDecorator => SetMetadata('audit-config', { action, ...options });

/**
 * Quick audit decorator for CREATE operations
 *
 * @description Convenience decorator for auditing resource creation operations.
 * Automatically includes request body and excludes common sensitive fields.
 *
 * @template TUser - Type of the authenticated user object
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @param resource - Optional resource name (defaults to controller.method)
 * @param options - Additional audit configuration options
 *
 * @returns {MethodDecorator} Decorator configured for CREATE auditing
 *
 * @example
 * ```typescript
 * @Post('users')
 * @AuditCreate<User, UserMetadata>('User', {
 *   level: AuditLevel.HIGH,
 *   customMetadata: (context, user) => ({
 *     createdBy: user.id,
 *     creationSource: 'admin_panel'
 *   })
 * })
 * async createUser(@Body() userData: CreateUserDto) {
 *   // Automatically audits with CREATE action and request body
 * }
 * ```
 *
 * @since 1.0.0
 */
export const AuditCreate = <TUser = any, TMetadata = any>(
  resource?: string,
  options?: Omit<AuditConfig<TUser, TMetadata>, 'action' | 'resource'>,
) =>
  Audit<TUser, TMetadata>(AuditAction.CREATE, {
    resource,
    includeRequestBody: true,
    ...options,
  });

/**
 * Quick audit decorator for READ operations
 *
 * @description Convenience decorator for auditing resource read/access operations.
 * Configured with minimal logging to avoid performance impact on frequent reads.
 *
 * @template TUser - Type of the authenticated user object
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @param resource - Optional resource name (defaults to controller.method)
 * @param options - Additional audit configuration options
 *
 * @returns {MethodDecorator} Decorator configured for READ auditing
 *
 * @example
 * ```typescript
 * @Get('sensitive-data/:id')
 * @AuditRead<User, AccessMetadata>('SensitiveData', {
 *   condition: (context, user) => {
 *     // Only audit access to sensitive data
 *     const dataId = context.switchToHttp().getRequest().params.id;
 *     return this.isSensitiveData(dataId);
 *   },
 *   customMetadata: (context, user) => ({
 *     accessReason: context.switchToHttp().getRequest().query.reason,
 *     dataClassification: 'confidential'
 *   })
 * })
 * async getSensitiveData(@Param('id') id: string) {
 *   // Conditionally audits data access
 * }
 * ```
 *
 * @since 1.0.0
 */
export const AuditRead = <TUser = any, TMetadata = any>(
  resource?: string,
  options?: Omit<AuditConfig<TUser, TMetadata>, 'action' | 'resource'>,
) => Audit<TUser, TMetadata>(AuditAction.READ, { resource, ...options });

/**
 * Quick audit decorator for UPDATE operations
 *
 * @description Convenience decorator for auditing resource modification operations.
 * Includes request body to capture what changes were made.
 *
 * @template TUser - Type of the authenticated user object
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @param resource - Optional resource name (defaults to controller.method)
 * @param options - Additional audit configuration options
 *
 * @returns {MethodDecorator} Decorator configured for UPDATE auditing
 *
 * @example
 * ```typescript
 * @Put('users/:id')
 * @AuditUpdate<User, UpdateMetadata>('User', {
 *   level: AuditLevel.MEDIUM,
 *   customMetadata: (context, user) => {
 *     const changes = context.switchToHttp().getRequest().body;
 *     return {
 *       changedFields: Object.keys(changes),
 *       updateReason: changes.reason || 'not_specified',
 *       previousValues: this.getPreviousValues(context.switchToHttp().getRequest().params.id)
 *     };
 *   }
 * })
 * async updateUser(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
 *   // Audits the update with changed fields and previous values
 * }
 * ```
 *
 * @since 1.0.0
 */
export const AuditUpdate = <TUser = any, TMetadata = any>(
  resource?: string,
  options?: Omit<AuditConfig<TUser, TMetadata>, 'action' | 'resource'>,
) =>
  Audit<TUser, TMetadata>(AuditAction.UPDATE, {
    resource,
    includeRequestBody: true,
    ...options,
  });

/**
 * Quick audit decorator for DELETE operations
 *
 * @description Convenience decorator for auditing resource deletion operations.
 * Configured with high audit level due to the destructive nature of deletions.
 *
 * @template TUser - Type of the authenticated user object
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @param resource - Optional resource name (defaults to controller.method)
 * @param options - Additional audit configuration options
 *
 * @returns {MethodDecorator} Decorator configured for DELETE auditing
 *
 * @example
 * ```typescript
 * @Delete('users/:id')
 * @AuditDelete<User, DeletionMetadata>('User', {
 *   level: AuditLevel.CRITICAL,
 *   customMetadata: (context, user) => ({
 *     deletionReason: context.switchToHttp().getRequest().body?.reason || 'not_specified',
 *     deletedUserData: this.getUserSnapshot(context.switchToHttp().getRequest().params.id),
 *     canRestore: true,
 *     retentionPeriod: '30_days'
 *   })
 * })
 * async deleteUser(@Param('id') id: string, @Body() deletionData?: { reason?: string }) {
 *   // Critical audit for user deletion with restoration metadata
 * }
 * ```
 *
 * @since 1.0.0
 */
export const AuditDelete = <TUser = any, TMetadata = any>(
  resource?: string,
  options?: Omit<AuditConfig<TUser, TMetadata>, 'action' | 'resource'>,
) => Audit<TUser, TMetadata>(AuditAction.DELETE, { resource, ...options });

/**
 * Service for querying and managing audit logs
 *
 * @description Provides high-level methods for retrieving, analyzing, and managing
 * audit log data. Supports filtering, pagination, statistics, and cleanup operations.
 *
 * @template TUser - Type of the authenticated user object
 * @template TMetadata - Type of custom metadata attached to audit entries
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class AuditController {
 *   constructor(
 *     private auditService: AuditService<User, CustomMetadata>
 *   ) {}
 *
 *   @Get('audit-logs')
 *   async getAuditLogs(@Query() filters: AuditFiltersDto, @Pagination() pagination: EnhancedPaginationQuery) {
 *     return this.auditService.getAuditLogs(filters, pagination);
 *   }
 *
 *   @Get('audit-stats')
 *   async getAuditStatistics() {
 *     return this.auditService.getAuditStats();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class AuditService<TUser = any, TMetadata = any> {
  constructor(
    private readonly auditStorage: AuditStorage<
      AuditLogEntry<TUser, TMetadata>
    >,
  ) {}

  /**
   * Retrieve audit logs with filtering and pagination
   *
   * @description Queries audit logs based on provided filters with support for pagination.
   * Useful for building audit log viewers and compliance reports.
   *
   * @param filters - Partial audit log entry to filter by
   * @param pagination - Optional pagination parameters
   * @returns Promise resolving to paginated audit log entries
   *
   * @example
   * ```typescript
   * // Get all CREATE actions by a specific user in the last 30 days
   * const thirtyDaysAgo = new Date();
   * thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
   *
   * const auditLogs = await auditService.getAuditLogs(
   *   {
   *     userId: 'user123',
   *     action: AuditAction.CREATE,
   *     timestamp: { $gte: thirtyDaysAgo }
   *   },
   *   { page: 1, limit: 50 }
   * );
   *
   * console.log(`Found ${auditLogs.pagination.total} CREATE actions`);
   * ```
   */
  async getAuditLogs(
    filters: Partial<AuditLogEntry<TUser, TMetadata>> = {},
    pagination?: any,
  ): Promise<PaginatedResponse<AuditLogEntry<TUser, TMetadata>>> {
    return this.auditStorage.find(filters, pagination);
  }

  /**
   * Retrieve a specific audit log entry by ID
   *
   * @description Fetches a single audit log entry using its unique identifier.
   * Useful for detailed audit log inspection and investigation.
   *
   * @param id - Unique identifier of the audit log entry
   * @returns Promise resolving to the audit log entry or null if not found
   *
   * @example
   * ```typescript
   * const auditEntry = await auditService.getAuditLogById('audit_123');
   * if (auditEntry) {
   *   console.log(`Action: ${auditEntry.action}`);
   *   console.log(`User: ${auditEntry.userId}`);
   *   console.log(`Resource: ${auditEntry.resource}`);
   *   console.log(`Metadata:`, auditEntry.metadata);
   * }
   * ```
   */
  async getAuditLogById(
    id: string,
  ): Promise<AuditLogEntry<TUser, TMetadata> | null> {
    return this.auditStorage.findById(id);
  }

  /**
   * Retrieve audit logs for a specific user
   *
   * @description Fetches all audit log entries associated with a particular user.
   * Useful for user activity reports and compliance investigations.
   *
   * @param userId - ID of the user to retrieve audit logs for
   * @param pagination - Optional pagination parameters
   * @returns Promise resolving to paginated user audit logs
   *
   * @example
   * ```typescript
   * // Get all actions performed by a user
   * const userActivity = await auditService.getUserAuditLogs(
   *   'user123',
   *   { page: 1, limit: 100 }
   * );
   *
   * // Analyze user behavior
   * const actionCounts = userActivity.data.reduce((acc, entry) => {
   *   acc[entry.action] = (acc[entry.action] || 0) + 1;
   *   return acc;
   * }, {});
   *
   * console.log('User action summary:', actionCounts);
   * ```
   */
  async getUserAuditLogs(
    userId: string,
    pagination?: any,
  ): Promise<PaginatedResponse<AuditLogEntry<TUser, TMetadata>>> {
    return this.auditStorage.find({ userId }, pagination);
  }

  /**
   * Retrieve audit logs for a specific resource
   *
   * @description Fetches audit log entries for a particular resource, optionally
   * filtered by resource ID. Useful for tracking changes to specific entities.
   *
   * @param resource - Name of the resource to retrieve audit logs for
   * @param resourceId - Optional specific resource ID to filter by
   * @param pagination - Optional pagination parameters
   * @returns Promise resolving to paginated resource audit logs
   *
   * @example
   * ```typescript
   * // Get all changes to a specific user record
   * const userChanges = await auditService.getResourceAuditLogs(
   *   'User',
   *   'user123',
   *   { page: 1, limit: 20 }
   * );
   *
   * // Get all changes to any user records
   * const allUserChanges = await auditService.getResourceAuditLogs(
   *   'User',
   *   undefined,
   *   { page: 1, limit: 100 }
   * );
   *
   * console.log(`Found ${userChanges.pagination.total} changes to user123`);
   * ```
   */
  async getResourceAuditLogs(
    resource: string,
    resourceId?: string,
    pagination?: any,
  ): Promise<PaginatedResponse<AuditLogEntry<TUser, TMetadata>>> {
    const filters: Partial<AuditLogEntry<TUser, TMetadata>> = { resource };
    if (resourceId) {
      filters.resourceId = resourceId;
    }
    return this.auditStorage.find(filters, pagination);
  }

  /**
   * Generate audit statistics and analytics
   *
   * @description Computes various statistics about audit log data including
   * total counts, action breakdowns, user activity, and recent activity summaries.
   *
   * @returns Promise resolving to audit statistics object
   *
   * @example
   * ```typescript
   * const stats = await auditService.getAuditStats();
   *
   * console.log(`Total audit entries: ${stats.totalLogs}`);
   * console.log('Action breakdown:', stats.actionBreakdown);
   * // { CREATE: 150, READ: 500, UPDATE: 75, DELETE: 25 }
   *
   * console.log('Most active users:', stats.userBreakdown);
   * // { user123: 45, user456: 32, user789: 28 }
   *
   * console.log('Recent activity:');
   * stats.recentActivity.forEach(entry => {
   *   console.log(`${entry.timestamp}: ${entry.action} on ${entry.resource}`);
   * });
   * ```
   */
  async getAuditStats(): Promise<{
    totalLogs: number;
    actionBreakdown: Record<string, number>;
    userBreakdown: Record<string, number>;
    recentActivity: AuditLogEntry<TUser, TMetadata>[];
  }> {
    // Get all logs for analysis (in production, you might want to optimize this)
    const allLogs = await this.auditStorage.find({});
    const logs = allLogs.data;

    // Calculate total logs
    const totalLogs = await this.auditStorage.count({});

    // Calculate action breakdown
    const actionBreakdown = logs.reduce(
      (acc, entry) => {
        acc[entry.action] = (acc[entry.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate user breakdown
    const userBreakdown = logs.reduce(
      (acc, entry) => {
        if (entry.userId) {
          acc[entry.userId] = (acc[entry.userId] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get recent activity (last 10 entries)
    const recentActivity = logs
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);

    return {
      totalLogs,
      actionBreakdown,
      userBreakdown,
      recentActivity,
    };
  }

  /**
   * Delete a specific audit log entry
   *
   * @description Removes a single audit log entry from storage. Use with caution
   * as this permanently deletes audit data which may be required for compliance.
   *
   * @param id - Unique identifier of the audit log entry to delete
   * @returns Promise resolving to true if deleted, false if not found
   *
   * @example
   * ```typescript
   * // Delete a specific audit entry (use with caution)
   * const deleted = await auditService.deleteAuditLog('audit_123');
   * if (deleted) {
   *   console.log('Audit entry deleted successfully');
   * } else {
   *   console.log('Audit entry not found');
   * }
   * ```
   */
  async deleteAuditLog(id: string): Promise<boolean> {
    return this.auditStorage.delete(id);
  }

  /**
   * Delete multiple audit log entries matching filters
   *
   * @description Removes multiple audit log entries that match the specified criteria.
   * Commonly used for data retention policies and cleanup operations.
   *
   * @param filters - Criteria for selecting audit logs to delete
   * @returns Promise resolving to the number of deleted entries
   *
   * @example
   * ```typescript
   * // Delete audit logs older than 2 years (retention policy)
   * const twoYearsAgo = new Date();
   * twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
   *
   * const deletedCount = await auditService.deleteAuditLogs({
   *   timestamp: { $lt: twoYearsAgo },
   *   level: AuditLevel.LOW // Only delete low-importance entries
   * });
   *
   * console.log(`Deleted ${deletedCount} old audit entries`);
   *
   * // Delete all audit logs for a deactivated user
   * const userDeletions = await auditService.deleteAuditLogs({
   *   userId: 'deactivated_user_123'
   * });
   *
   * console.log(`Deleted ${userDeletions} audit entries for deactivated user`);
   * ```
   */
  async deleteAuditLogs(
    filters: Partial<AuditLogEntry<TUser, TMetadata>>,
  ): Promise<number> {
    return this.auditStorage.deleteMany(filters);
  }
}
