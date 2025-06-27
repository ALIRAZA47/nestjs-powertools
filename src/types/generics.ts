import type { ExecutionContext } from '@nestjs/common';
import type {
  ResponseStatus,
  ResponseCodes,
  SortOrder,
  AuditAction,
  AuditLevel,
  GuardLogic,
  CircuitBreakerState,
  RetryStrategy,
  ValidationStrategy,
  CacheStrategy,
  LogLevel,
  RateLimitStrategy,
} from './enums';

// Generic Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  status: ResponseStatus;
  code?: ResponseCodes;
  data?: T;
  message?: string;
  timestamp: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    offset?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
    search?: string;
    filters?: Record<string, any>;
  };
  status: ResponseStatus;
  timestamp: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  status: ResponseStatus.ERROR;
  code: ResponseCodes;
  error: {
    message: string;
    details?: any;
    stack?: string;
    field?: string;
  };
  timestamp: string;
  requestId?: string;
}

// Generic Configuration Types
export interface BaseConfig {
  enabled?: boolean;
  environment?: string[];
  debug?: boolean;
}

export interface PaginationConfig extends BaseConfig {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  allowUnlimited?: boolean;
  sortOrder?: SortOrder;
}

// Enhanced Pagination Types
export interface PaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  minLimit?: number;
  allowUnlimited?: boolean;
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
  allowedSortFields?: string[];
  allowedSortOrders?: SortOrder[];
  pageParam?: string;
  limitParam?: string;
  sortByParam?: string;
  sortOrderParam?: string;
  searchParam?: string;
  filtersParam?: string;
  transform?: boolean;
  validate?: boolean;
  customValidator?: (query: any) => boolean | string;
  onInvalidQuery?: 'throw' | 'default' | 'ignore';
}

export interface EnhancedPaginationQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: SortOrder;
  search?: string;
  filters?: Record<string, any>;
  offset?: number;
  hasCustomLimits?: boolean;
  originalQuery?: Record<string, any>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  offset: number;
  sortBy: string;
  sortOrder: SortOrder;
  search?: string;
  filters?: Record<string, any>;
}

export interface CacheConfig<T = any> extends BaseConfig {
  strategy?: CacheStrategy;
  ttl?: number;
  key?: string | ((context: ExecutionContext) => string);
  condition?: (data: T) => boolean;
  serializer?: (data: T) => string;
  deserializer?: (data: string) => T;
}

export interface ValidationConfig extends BaseConfig {
  strategy?: ValidationStrategy;
  transform?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  skipMissingProperties?: boolean;
  customValidators?: Record<string, (value: any) => boolean>;
}

export interface LoggingConfig extends BaseConfig {
  level?: LogLevel;
  includeBody?: boolean;
  includeHeaders?: boolean;
  includeQuery?: boolean;
  excludeFields?: string[];
  maxBodySize?: number;
  sensitiveFields?: string[];
}

export interface RateLimitConfig extends BaseConfig {
  strategy?: RateLimitStrategy;
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (context: ExecutionContext) => string;
}

// Generic Guard Types
export interface CustomAuthGuard<TUser = any, TContext = any> {
  canActivate(
    context: ExecutionContext,
    user: TUser,
    requiredPermissions?: string[],
    customContext?: TContext,
  ): boolean | Promise<boolean>;
}

export interface CompositeGuardConfig<TUser = any> {
  guards: CustomAuthGuard<TUser>[];
  logic: GuardLogic;
  name?: string;
  failFast?: boolean;
  customEvaluator?: (results: boolean[], logic: GuardLogic) => boolean;
}

// Generic Audit Types
export interface AuditLogEntry<TUser = any, TMetadata = any> {
  id?: string;
  userId?: string;
  user?: TUser;
  action: AuditAction | string;
  resource?: string;
  resourceId?: string;
  level?: AuditLevel;
  metadata?: TMetadata;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  requestBody?: any;
  responseStatus?: number;
  duration?: number;
  endpoint?: string;
  method?: string;
  success?: boolean;
  errorMessage?: string;
}

export interface AuditConfig<TUser = any, TMetadata = any> extends BaseConfig {
  action: AuditAction | string;
  resource?: string;
  level?: AuditLevel;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
  excludeFields?: string[];
  customMetadata?: (context: ExecutionContext, user?: TUser) => TMetadata;
  condition?: (context: ExecutionContext, user?: TUser) => boolean;
}

export interface AuditStorage<TEntry = AuditLogEntry> {
  save(entry: TEntry): Promise<void>;
  find(
    filters: Partial<TEntry>,
    pagination?: PaginationQuery,
  ): Promise<PaginatedResponse<TEntry>>;
  findById(id: string): Promise<TEntry | null>;
  count(filters: Partial<TEntry>): Promise<number>;
  delete(id: string): Promise<boolean>;
  deleteMany(filters: Partial<TEntry>): Promise<number>;
}

// Generic HTTP Resilience Types
export interface RetryConfig extends BaseConfig {
  maxAttempts?: number;
  delay?: number;
  strategy?: RetryStrategy;
  exponentialBase?: number;
  maxDelay?: number;
  retryCondition?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export interface CircuitBreakerConfig<TFallback = any> extends BaseConfig {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  fallbackHandler?: (error: any) => TFallback | Promise<TFallback>;
  onStateChange?: (state: CircuitBreakerState) => void;
}

export interface ResilientHttpConfig<TFallback = any> extends BaseConfig {
  timeout?: number;
  retry?: RetryConfig;
  circuitBreaker?: CircuitBreakerConfig<TFallback>;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

// Generic Utility Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  filters?: Record<string, any>;
}

export interface AuthConfig<TUser = any> extends BaseConfig {
  guard?: CustomAuthGuard<TUser>;
  roles?: string[];
  permissions?: string[];
  customValidator?: (
    user: TUser,
    context: ExecutionContext,
  ) => boolean | Promise<boolean>;
  requireAll?: boolean;
}

// Generic Factory Types
export interface ConfigFactory<T> {
  create(environment?: string): T;
  merge(base: T, override: Partial<T>): T;
  validate(config: T): boolean;
}

export interface GuardFactory<TUser = any> {
  create(type: string, config: any): CustomAuthGuard<TUser>;
  register(name: string, guard: CustomAuthGuard<TUser>): void;
  get(name: string): CustomAuthGuard<TUser> | undefined;
}

// Generic Metrics Types
export interface MetricsCollector<T = any> {
  record(metric: T): void;
  get(filters?: Partial<T>): T[];
  aggregate(filters?: Partial<T>): Record<string, number>;
  clear(): void;
}

export interface HttpRequestMetrics {
  id: string;
  url: string;
  method: string;
  duration: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  retryAttempt?: number;
  circuitBreakerState?: CircuitBreakerState;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}
