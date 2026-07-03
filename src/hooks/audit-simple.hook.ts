import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { AuditConfig, AuditLogEntry, AuditStorage } from '../types/hooks';

/**
 * Lightweight in-memory storage for audit logs.
 */
@Injectable()
export class SimpleInMemoryAuditStorage implements AuditStorage {
  private readonly logs: AuditLogEntry[] = [];

  async save(entry: AuditLogEntry): Promise<void> {
    entry.id = Date.now().toString();
    this.logs.push(entry);
  }

  async find(filters: Partial<AuditLogEntry>): Promise<AuditLogEntry[]> {
    return this.logs.filter((log) =>
      Object.entries(filters).every(
        ([k, v]) => log[k as keyof AuditLogEntry] === v,
      ),
    );
  }

  async findById(id: string): Promise<AuditLogEntry | null> {
    return this.logs.find((log) => log.id === id) || null;
  }

  /** Convenience helpers for tests */
  getAll(): AuditLogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs.length = 0;
  }
}

/**
 * Interceptor that records basic audit information for each request.
 */
@Injectable()
export class SimpleAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SimpleAuditInterceptor.name);

  constructor(private readonly storage: AuditStorage) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const config: AuditConfig | undefined = Reflect.getMetadata(
      'audit-config',
      context.getHandler(),
    );
    if (!config) {
      return next.handle();
    }

    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    const entry: AuditLogEntry = {
      userId: req.user?.id || req.user?.sub,
      action: config.action,
      resource: config.resource || context.getHandler().name,
      resourceId: req.params?.id,
      timestamp: new Date(),
      requestBody: config.includeRequestBody ? req.body : undefined,
    };

    return next.handle().pipe(
      tap(() => {
        entry.responseStatus = context.switchToHttp().getResponse().statusCode;
        entry.duration = Date.now() - start;
        this.storage.save(entry).catch((err) =>
          this.logger.error('Failed to save audit log', err),
        );
      }),
      catchError((error) => {
        entry.responseStatus = error.status || 500;
        entry.duration = Date.now() - start;
        entry.metadata = { error: error.message };
        this.storage.save(entry).catch((err) =>
          this.logger.error('Failed to save audit log', err),
        );
        return throwError(() => error);
      }),
    );
  }
}

/**
 * Decorator to enable simple audit logging on a controller method.
 */
export const SimpleAudit = (
  action: string,
  options: Omit<AuditConfig, 'action'> = {},
): MethodDecorator => SetMetadata('audit-config', { action, ...options });
