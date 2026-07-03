// Core types and enums
export * from './types/enums';
export * from './types/generics';
export * from './config/powertools.config';

// Parameter extractors and decorators
export * from './decorators/parameter-extractors';
export * from './decorators/endpoint-combinations';
export * from './decorators/auth';
export {
  UseAndGuards,
  UseOrGuards,
  UseNotGuard,
  AuditableEndpoint,
  PowerEndpoint,
  UltimatePowerEndpoint,
} from './decorators/hooks';
export * from './decorators/resilient-http.decorator';

// Hooks and services
export * from './hooks/composite-guard.hook';
export * from './hooks/resilient-http.hook';

// Audit logging (exported from hooks/audit-logging.hook only)
export {
  MongoAuditStorage,
  InMemoryAuditStorage,
  AuditInterceptor,
  AuditService,
  Audit,
  AuditCreate,
  AuditRead,
  AuditUpdate,
  AuditDelete,
} from './hooks/audit-logging.hook';
// Lightweight audit hook exports
export {
  SimpleInMemoryAuditStorage,
  SimpleAuditInterceptor,
  SimpleAudit,
} from './hooks/audit-simple.hook';

// Guards and interceptors
export * from './guards/configurable-auth.guard';
export * from './guards/jwt-auth.guard';
export * from './guards/rate-limit.guard';
export * from './interceptors/cache.interceptor';
export * from './interceptors/logging.interceptor';
export * from './interceptors/transform.interceptor';
export * from './interceptors/resilient-http.interceptor';

// Utilities
export * from './helpers/response-formatter';
export * from './helpers/guard.helper';
export * from './helpers/validation.helper';

// Pipes
export * from './pipes/validation.pipe';

// Legacy exports for backward compatibility
export {
  DefaultRoles,
  SortOrder,
  ResponseStatus,
  LogLevel,
  CustomAuthGuard,
  AuthConfig,
  GuardRegistry,
  PaginationQuery,
  PaginatedResponse,
  CacheOptions,
  ValidationOptions,
  RateLimitOptions,
  LoggingOptions,
  ApiResponseConfig,
} from './types';
export {
  GuardLogic,
  CompositeGuardConfig,
  AuditAction,
  AuditLogEntry,
  AuditConfig,
  AuditStorage,
  CircuitBreakerState,
  RetryConfig,
  CircuitBreakerConfig,
  ResilientHttpConfig,
  CircuitBreakerStats,
  HttpRequestMetrics,
} from './types/hooks';
export * from './config/guard-registry';

export * from './hooks/audit-logging.hook';
export * from './hooks/audit-simple.hook';
export * from './config/powertools.config';
export * from './powertools.module';
