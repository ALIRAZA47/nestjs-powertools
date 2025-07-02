// Authentication & Authorization Enums
export enum DefaultRoles {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest',
  SUPER_ADMIN = 'super_admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum PermissionActions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXECUTE = 'execute',
}

export enum PermissionResources {
  USER = 'user',
  POST = 'post',
  COMMENT = 'comment',
  FILE = 'file',
  SYSTEM = 'system',
  ALL = '*',
}

// HTTP & API Enums
export enum HttpMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum HttpStatusCodes {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// Response & Status Enums
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  PENDING = 'pending',
}

export enum ResponseCodes {
  OPERATION_SUCCESSFUL = 'OPERATION_SUCCESSFUL',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

// Sorting & Pagination Enums
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
}

export enum PaginationDefaults {
  DEFAULT_PAGE = 1,
  DEFAULT_LIMIT = 10,
  MAX_LIMIT = 100,
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  MIN_LIMIT = 1,
}

// Logging Enums
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export enum LogContext {
  AUTH = 'AUTH',
  HTTP = 'HTTP',
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  AUDIT = 'AUDIT',
  VALIDATION = 'VALIDATION',
  GUARD = 'GUARD',
  INTERCEPTOR = 'INTERCEPTOR',
}

// Cache Enums
export enum CacheStrategy {
  MEMORY = 'memory',
  REDIS = 'redis',
  DATABASE = 'database',
  HYBRID = 'hybrid',
}

export enum CacheTTL {
  SHORT = 300, // 5 minutes
  MEDIUM = 1800, // 30 minutes
  LONG = 3600, // 1 hour
  VERY_LONG = 86400, // 24 hours
}

// Audit Enums
export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  CUSTOM = 'CUSTOM',
}

export enum AuditLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Guard Logic Enums
export enum GuardLogic {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  XOR = 'XOR',
  NAND = 'NAND',
  NOR = 'NOR',
}

// Circuit Breaker Enums
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export enum RetryStrategy {
  FIXED_DELAY = 'fixed_delay',
  EXPONENTIAL_BACKOFF = 'exponential_backoff',
  LINEAR_BACKOFF = 'linear_backoff',
  CUSTOM = 'custom',
}

// Validation Enums
export enum ValidationStrategy {
  STRICT = 'strict',
  LENIENT = 'lenient',
  CUSTOM = 'custom',
}

export enum ValidationErrorHandling {
  THROW = 'throw',
  COLLECT = 'collect',
  IGNORE = 'ignore',
}

// Environment Enums
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

// Rate Limiting Enums
export enum RateLimitStrategy {
  FIXED_WINDOW = 'fixed_window',
  SLIDING_WINDOW = 'sliding_window',
  TOKEN_BUCKET = 'token_bucket',
  LEAKY_BUCKET = 'leaky_bucket',
}

export enum RateLimitScope {
  GLOBAL = 'global',
  PER_USER = 'per_user',
  PER_IP = 'per_ip',
  PER_ENDPOINT = 'per_endpoint',
}
