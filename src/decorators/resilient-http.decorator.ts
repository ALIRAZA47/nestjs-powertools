import { SetMetadata, applyDecorators } from '@nestjs/common';
import type { ResilientHttpConfig } from '../types/hooks';

// Metadata key for resilient HTTP configuration
export const RESILIENT_HTTP_CONFIG = 'resilient-http-config';

/**
 * Configure resilient HTTP behavior for HTTP client calls within a method
 */
export const ResilientHttp = (config: ResilientHttpConfig): MethodDecorator => {
  return SetMetadata(RESILIENT_HTTP_CONFIG, config);
};

/**
 * Quick decorator for retry-only configuration
 */
export const WithRetry = (
  maxAttempts = 3,
  delay = 1000,
  exponentialBackoff = true,
): MethodDecorator => {
  return ResilientHttp({
    retry: {
      maxAttempts,
      delay,
      exponentialBackoff,
    },
  });
};

/**
 * Quick decorator for timeout configuration
 */
export const WithTimeout = (timeout: number): MethodDecorator => {
  return ResilientHttp({ timeout });
};

/**
 * Quick decorator for circuit breaker configuration
 */
export const WithCircuitBreaker = (
  failureThreshold = 5,
  resetTimeout = 60000,
  fallbackHandler?: (error: any) => any,
): MethodDecorator => {
  return ResilientHttp({
    circuitBreaker: {
      failureThreshold,
      resetTimeout,
      fallbackHandler,
    },
  });
};

/**
 * Complete resilient HTTP decorator with all features
 */
export const ResilientEndpoint = (
  config: ResilientHttpConfig,
): MethodDecorator => {
  return applyDecorators(
    ResilientHttp({
      timeout: 10000,
      enableLogging: true,
      ...config,
    }),
  );
};

/**
 * Quick decorator for external API calls with sensible defaults
 */
export const ExternalApiCall = (options?: {
  timeout?: number;
  maxRetries?: number;
  enableCircuitBreaker?: boolean;
}): MethodDecorator => {
  const config: ResilientHttpConfig = {
    timeout: options?.timeout || 10000,
    enableLogging: true,
    retry: {
      maxAttempts: options?.maxRetries || 3,
      delay: 1000,
      exponentialBackoff: true,
    },
  };

  if (options?.enableCircuitBreaker) {
    config.circuitBreaker = {
      failureThreshold: 5,
      resetTimeout: 60000,
    };
  }

  return ResilientHttp(config);
};
