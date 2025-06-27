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
  AuditAction,
} from '../types/hooks';

// MongoDB Storage Implementation (example)
@Injectable()
export class MongoAuditStorage implements AuditStorage {
  private readonly logger = new Logger(MongoAuditStorage.name);

  async save(entry: AuditLogEntry): Promise<void> {
    try {
      // Replace with your actual MongoDB implementation
      // Example: await this.auditModel.create(entry)
      this.logger.log(
        `Audit log saved: ${entry.action} by user ${entry.userId}`,
      );
      console.log('Audit Entry:', JSON.stringify(entry, null, 2));
    } catch (error) {
      this.logger.error('Failed to save audit log', error);
    }
  }

  async find(filters: Partial<AuditLogEntry>): Promise<AuditLogEntry[]> {
    // Replace with your actual MongoDB query
    // Example: return this.auditModel.find(filters).exec()
    return [];
  }

  async findById(id: string): Promise<AuditLogEntry | null> {
    // Replace with your actual MongoDB query
    // Example: return this.auditModel.findById(id).exec()
    return null;
  }
}

// In-Memory Storage (for testing/development)
@Injectable()
export class InMemoryAuditStorage implements AuditStorage {
  private logs: AuditLogEntry[] = [];
  private readonly logger = new Logger(InMemoryAuditStorage.name);

  async save(entry: AuditLogEntry): Promise<void> {
    entry.id = Date.now().toString();
    this.logs.push(entry);
    this.logger.log(`Audit log saved: ${entry.action} by user ${entry.userId}`);
  }

  async find(filters: Partial<AuditLogEntry>): Promise<AuditLogEntry[]> {
    return this.logs.filter((log) => {
      return Object.entries(filters).every(
        ([key, value]) => log[key as keyof AuditLogEntry] === value,
      );
    });
  }

  async findById(id: string): Promise<AuditLogEntry | null> {
    return this.logs.find((log) => log.id === id) || null;
  }

  // Additional method for testing
  getAllLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditStorage: AuditStorage) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.getAuditConfig(context);
    if (!auditConfig) {
      return next.handle();
    }

    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const auditEntry: AuditLogEntry = {
      userId: user?.id || user?.sub,
      userEmail: user?.email,
      action: auditConfig.action,
      resource:
        auditConfig.resource || this.extractResourceFromContext(context),
      resourceId: this.extractResourceId(request),
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      timestamp: new Date(),
      endpoint: request.url,
      method: request.method,
      requestBody: auditConfig.includeRequestBody
        ? this.sanitizeData(request.body, auditConfig.excludeFields)
        : undefined,
      metadata: auditConfig.customMetadata
        ? auditConfig.customMetadata(context)
        : {},
    };

    return next.handle().pipe(
      tap((response) => {
        auditEntry.duration = Date.now() - startTime;
        auditEntry.responseStatus = context
          .switchToHttp()
          .getResponse().statusCode;

        if (auditConfig.includeResponseBody) {
          auditEntry.metadata = {
            ...auditEntry.metadata,
            responseBody: this.sanitizeData(
              response,
              auditConfig.excludeFields,
            ),
          };
        }

        this.auditStorage.save(auditEntry).catch((error) => {
          this.logger.error('Failed to save audit log', error);
        });
      }),
      catchError((error) => {
        auditEntry.duration = Date.now() - startTime;
        auditEntry.responseStatus = error.status || 500;
        auditEntry.metadata = {
          ...auditEntry.metadata,
          error: error.message,
        };

        this.auditStorage.save(auditEntry).catch((saveError) => {
          this.logger.error(
            'Failed to save audit log for error case',
            saveError,
          );
        });

        return throwError(() => error);
      }),
    );
  }

  private getAuditConfig(context: ExecutionContext): AuditConfig | null {
    const handler = context.getHandler();
    const auditConfig = Reflect.getMetadata('audit-config', handler);
    return auditConfig || null;
  }

  private extractResourceFromContext(context: ExecutionContext): string {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    return `${className}.${handlerName}`;
  }

  private extractResourceId(request: any): string | undefined {
    return request.params?.id || request.params?.userId || request.body?.id;
  }

  private sanitizeData(data: any, excludeFields: string[] = []): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const defaultExcludeFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
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

// Decorator for audit logging
export const Audit = (
  action: AuditAction | string,
  options: Omit<AuditConfig, 'action'> = {},
): MethodDecorator => {
  return SetMetadata('audit-config', { action, ...options });
};

// Service for querying audit logs
@Injectable()
export class AuditService {
  constructor(private readonly auditStorage: AuditStorage) {}

  async getAuditLogs(
    filters: Partial<AuditLogEntry> = {},
  ): Promise<AuditLogEntry[]> {
    return this.auditStorage.find(filters);
  }

  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    return this.auditStorage.findById(id);
  }

  async getUserAuditLogs(userId: string): Promise<AuditLogEntry[]> {
    return this.auditStorage.find({ userId });
  }

  async getResourceAuditLogs(
    resource: string,
    resourceId?: string,
  ): Promise<AuditLogEntry[]> {
    const filters: Partial<AuditLogEntry> = { resource };
    if (resourceId) {
      filters.resourceId = resourceId;
    }
    return this.auditStorage.find(filters);
  }
}
