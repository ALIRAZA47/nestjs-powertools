import type { ExecutionContext } from '@nestjs/common';

// Composite Guard Types
export enum GuardLogic {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

export interface CompositeGuardConfig {
  guards: any[];
  logic: GuardLogic;
  name?: string;
}

// Audit Hook Types
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CUSTOM = 'CUSTOM',
}

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction | string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  requestBody?: any;
  responseStatus?: number;
  duration?: number;
  endpoint?: string;
  method?: string;
}

export interface AuditConfig {
  action: AuditAction | string;
  resource?: string;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  excludeFields?: string[];
  customMetadata?: (context: ExecutionContext) => Record<string, any>;
}

export interface AuditStorage {
  save(entry: AuditLogEntry): Promise<void>;
  find(filters: Partial<AuditLogEntry>): Promise<AuditLogEntry[]>;
  findById(id: string): Promise<AuditLogEntry | null>;
}

// Resilient HTTP Types
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: any) => boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  fallbackHandler?: (error: any) => any;
}

export interface ResilientHttpConfig {
  timeout?: number;
  retry?: RetryConfig;
  circuitBreaker?: CircuitBreakerConfig;
  enableLogging?: boolean;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export interface HttpRequestMetrics {
  url: string;
  method: string;
  duration: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  retryAttempt?: number;
  timestamp: Date;
}
