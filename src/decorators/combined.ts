import {
  applyDecorators,
  UseGuards,
  UseInterceptors,
  UsePipes,
  SetMetadata,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ConfigurableAuthGuard } from '../guards/configurable-auth.guard';
import { ValidationPipe } from '../pipes/validation.pipe';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { CacheInterceptor } from '../interceptors/cache.interceptor';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import type {
  ValidationOptions,
  CacheOptions,
  RateLimitOptions,
  LoggingOptions,
  AuthConfig,
  ApiResponseConfig,
} from '../types';
import { DefaultRoles } from '../types';

/**
 * Configurable secure endpoint with custom auth logic
 */
export function SecureEndpoint(
  authConfig?: AuthConfig & {
    validation?: ValidationOptions;
    logging?: LoggingOptions;
    description?: string;
    responses?: ApiResponseConfig[];
  },
) {
  const decorators: Array<ClassDecorator | MethodDecorator> = [
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard, ConfigurableAuthGuard),
    SetMetadata('authConfig', authConfig),
    UsePipes(new ValidationPipe(authConfig?.validation)),
    UseInterceptors(LoggingInterceptor, TransformInterceptor),
  ];

  if (authConfig?.description) {
    decorators.push(ApiOperation({ summary: authConfig.description }));
  }

  if (authConfig?.responses?.length) {
    authConfig.responses.forEach((response) => {
      decorators.push(
        ApiResponse({
          status: response.status,
          description: response.description,
        }),
      );
    });
  }

  return applyDecorators(...decorators);
}

/**
 * Combines caching, rate limiting, and response transformation for public endpoints
 */
export function PublicCachedEndpoint(options?: {
  cache?: CacheOptions;
  rateLimit?: RateLimitOptions;
  validation?: ValidationOptions;
  description?: string;
}) {
  const decorators: Array<ClassDecorator | MethodDecorator> = [
    UseInterceptors(TransformInterceptor),
    UsePipes(new ValidationPipe(options?.validation)),
  ];

  if (options?.cache) {
    decorators.push(UseInterceptors(new CacheInterceptor(options.cache)));
  }

  if (options?.rateLimit) {
    decorators.push(UseGuards(new RateLimitGuard(options.rateLimit)));
  }

  if (options?.description) {
    decorators.push(ApiOperation({ summary: options.description }));
  }

  return applyDecorators(...decorators);
}

/**
 * Quick decorator for admin-only endpoints using enum
 */
export function AdminOnly(description?: string) {
  return SecureEndpoint({
    roles: [DefaultRoles.ADMIN],
    description: description || 'Admin only endpoint',
    responses: [
      { status: 200, description: 'Success' },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' },
    ],
  });
}

/**
 * Quick decorator for user endpoints using enum
 */
export function UserEndpoint(description?: string) {
  return SecureEndpoint({
    roles: [DefaultRoles.USER, DefaultRoles.ADMIN],
    description: description || 'User endpoint',
    validation: { transform: true, whitelist: true },
    responses: [
      { status: 200, description: 'Success' },
      { status: 401, description: 'Unauthorized' },
    ],
  });
}

/**
 * Custom role-based endpoint
 */
export function RequireRoles(
  roles: (string | DefaultRoles)[],
  description?: string,
) {
  return SecureEndpoint({
    roles,
    description: description || `Requires roles: ${roles.join(', ')}`,
  });
}

/**
 * Permission-based endpoint
 */
export function RequirePermissions(
  permissions: string[],
  description?: string,
) {
  return SecureEndpoint({
    permissions,
    description:
      description || `Requires permissions: ${permissions.join(', ')}`,
  });
}
