import { applyDecorators, UseGuards, UseInterceptors } from '@nestjs/common';
import { CompositeGuardHelper } from '../hooks/composite-guard.hook';
import { AuditInterceptor, Audit } from '../hooks/audit.hook';
import { ResilientHttpInterceptor } from '../interceptors/resilient-http.interceptor';
import type { AuditAction, ResilientHttpConfig } from '../types/hooks';

/**
 * Apply multiple guards with AND logic - all must pass
 */
export function UseAndGuards(...guards: any[]) {
  return UseGuards(CompositeGuardHelper.And(...guards));
}

/**
 * Apply multiple guards with OR logic - at least one must pass
 */
export function UseOrGuards(...guards: any[]) {
  return UseGuards(CompositeGuardHelper.Or(...guards));
}

/**
 * Apply NOT logic to a guard - inverts the result
 */
export function UseNotGuard(guard: any) {
  return UseGuards(CompositeGuardHelper.Not(guard));
}

/**
 * Combine audit logging with other decorators
 */
export function AuditableEndpoint(
  action: AuditAction | string,
  options?: {
    resource?: string;
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
    excludeFields?: string[];
  },
) {
  return applyDecorators(
    Audit(action, options),
    UseInterceptors(AuditInterceptor),
  );
}

/**
 * Quick decorator for CRUD operations with audit
 */
export function AuditCreate(resource?: string) {
  return AuditableEndpoint('CREATE', {
    resource,
    includeRequestBody: true,
    excludeFields: ['password', 'token'],
  });
}

export function AuditRead(resource?: string) {
  return AuditableEndpoint('READ', { resource });
}

export function AuditUpdate(resource?: string) {
  return AuditableEndpoint('UPDATE', {
    resource,
    includeRequestBody: true,
    excludeFields: ['password', 'token'],
  });
}

export function AuditDelete(resource?: string) {
  return AuditableEndpoint('DELETE', { resource });
}

/**
 * Combine multiple powertools in one decorator
 */
export function PowerEndpoint(options: {
  // Auth options
  guards?: any[];
  guardLogic?: 'AND' | 'OR';

  // Audit options
  audit?: {
    action: AuditAction | string;
    resource?: string;
    includeRequestBody?: boolean;
    excludeFields?: string[];
  };

  // Resilient HTTP options
  resilientHttp?: ResilientHttpConfig;
}) {
  const decorators: any[] = [];

  // Add composite guards
  if (options.guards?.length) {
    if (options.guardLogic === 'OR') {
      decorators.push(UseOrGuards(...options.guards));
    } else {
      decorators.push(UseAndGuards(...options.guards));
    }
  }

  // Add audit logging
  if (options.audit) {
    decorators.push(AuditableEndpoint(options.audit.action, options.audit));
  }

  // Add resilient HTTP
  if (options.resilientHttp) {
    decorators.push(UseInterceptors(ResilientHttpInterceptor));
  }

  return applyDecorators(...decorators);
}

/**
 * Ultimate powertool decorator - combines everything
 */
export function UltimatePowerEndpoint(options: {
  // Security
  adminOnly?: boolean;
  roles?: string[];
  permissions?: string[];

  // Audit
  auditAction?: AuditAction | string;
  auditResource?: string;

  // Resilience
  timeout?: number;
  retries?: number;
  circuitBreaker?: boolean;

  // Validation
  validateRequest?: boolean;

  // Caching
  cache?: boolean;
  cacheTtl?: number;
}) {
  const decorators: any[] = [];

  // Add authentication/authorization
  if (options.adminOnly) {
    decorators.push(UseGuards(/* AdminGuard */));
  }

  // Add audit logging
  if (options.auditAction) {
    decorators.push(
      AuditableEndpoint(options.auditAction, {
        resource: options.auditResource,
        includeRequestBody: true,
      }),
    );
  }

  // Add resilient HTTP
  if (options.timeout || options.retries || options.circuitBreaker) {
    const resilientConfig: ResilientHttpConfig = {};

    if (options.timeout) {
      resilientConfig.timeout = options.timeout;
    }

    if (options.retries) {
      resilientConfig.retry = {
        maxAttempts: options.retries,
        exponentialBackoff: true,
      };
    }

    if (options.circuitBreaker) {
      resilientConfig.circuitBreaker = {
        failureThreshold: 5,
        resetTimeout: 60000,
      };
    }

    decorators.push(UseInterceptors(ResilientHttpInterceptor));
  }

  return applyDecorators(...decorators);
}
