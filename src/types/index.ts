import type { ExecutionContext } from '@nestjs/common';

// Enums for better type safety
export enum DefaultRoles {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Configuration interfaces for extensibility
export interface CustomAuthGuard {
  canActivate(
    context: ExecutionContext,
    user: any,
    requiredPermissions?: string[],
  ): boolean | Promise<boolean>;
}

export interface AuthConfig {
  guard?: CustomAuthGuard;
  roles?: string[] | DefaultRoles[];
  permissions?: string[];
  customValidator?: (
    user: any,
    context: ExecutionContext,
  ) => boolean | Promise<boolean>;
}

export interface GuardRegistry {
  [key: string]: CustomAuthGuard;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export interface ValidationOptions {
  transform?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
}

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  strategy?: 'delay' | 'reject';
  delayAfter?: number;
  delayMs?: number;
  maxDelayMs?: number;
  delayMultiplier?: number;
  enableLogging?: boolean;
}

export interface LoggingOptions {
  includeBody?: boolean;
  includeHeaders?: boolean;
  excludeFields?: string[];
}

export interface ApiResponseConfig {
  status: number;
  description: string;
}
