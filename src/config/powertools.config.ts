import type {
  PaginationConfig,
  CacheConfig,
  ValidationConfig,
  LoggingConfig,
  RateLimitConfig,
  AuditConfig,
  ResilientHttpConfig,
  AuthConfig,
} from '../types/generics';
import {
  SortOrder,
  CacheStrategy,
  ValidationStrategy,
  LogLevel,
  RateLimitStrategy,
  AuditLevel,
  RetryStrategy,
  Environment,
} from '../types/enums';

/**
 * Configuration for audit log storage
 * @property type 'mongodb' or 'file'
 * @property mongoUrl MongoDB connection string (if type is 'mongodb')
 * @property filePath Path to JSON file (if type is 'file')
 */
export interface AuditStorageConfig {
  type: 'mongodb' | 'file';
  mongoUrl?: string;
  filePath?: string;
}

/**
 * Main configuration interface for Powertools
 *
 * @property global Global settings (enabled, environment, debug, etc.)
 * @property pagination Pagination config (defaultPage, defaultLimit, maxLimit, etc.)
 * @property cache Caching config (strategy, ttl, etc.)
 * @property validation Validation config (strategy, whitelist, etc.)
 * @property logging Logging config (level, includeBody, etc.)
 * @property rateLimit Rate limiting config (strategy, windowMs, max, etc.)
 * @property audit Audit logging config (see AuditConfig & AuditStorageConfig)
 * @property resilientHttp HTTP resilience config (timeout, retry, circuitBreaker, etc.)
 * @property auth Auth config (enabled, requireAll, etc.)
 * @property custom Any custom config
 */
export interface PowertoolsConfig {
  // Global settings
  global?: {
    enabled?: boolean;
    environment?: Environment;
    debug?: boolean;
    requestIdHeader?: string;
    enableMetrics?: boolean;
  };

  // Feature-specific configurations
  pagination?: PaginationConfig;
  cache?: CacheConfig;
  validation?: ValidationConfig;
  logging?: LoggingConfig;
  rateLimit?: RateLimitConfig;
  audit?: AuditConfig & {
    storage?: AuditStorageConfig;
  };
  resilientHttp?: ResilientHttpConfig;
  auth?: AuthConfig;

  // Custom configurations
  custom?: Record<string, any>;
}

/**
 * Default configuration for Powertools
 *
 * You can override any option by passing it to PowertoolsModule.forRoot or PowertoolsConfigService.getInstance.
 */
export const DEFAULT_POWERTOOLS_CONFIG: PowertoolsConfig = {
  global: {
    enabled: true,
    environment: Environment.DEVELOPMENT,
    debug: false,
    requestIdHeader: 'x-request-id',
    enableMetrics: true,
  },

  pagination: {
    enabled: true,
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
    allowUnlimited: false,
    sortOrder: SortOrder.ASC,
  },

  cache: {
    enabled: true,
    strategy: CacheStrategy.MEMORY,
    ttl: 300000, // 5 minutes
  },

  validation: {
    enabled: true,
    strategy: ValidationStrategy.STRICT,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
  },

  logging: {
    enabled: true,
    level: LogLevel.INFO,
    includeBody: false,
    includeHeaders: false,
    includeQuery: true,
    excludeFields: ['password', 'token', 'secret', 'key'],
    maxBodySize: 1024 * 10, // 10KB
    sensitiveFields: ['authorization', 'cookie', 'x-api-key'],
  },

  rateLimit: {
    enabled: true,
    strategy: RateLimitStrategy.FIXED_WINDOW,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  audit: {
    enabled: true,
    level: AuditLevel.MEDIUM,
    includeRequestBody: false,
    includeResponseBody: false,
    excludeFields: ['password', 'token', 'secret'],
    action: '',
    storage: {
      type: 'file',
      filePath: './audit-logs.json',
    },
  },

  resilientHttp: {
    enabled: true,
    timeout: 10000,
    enableLogging: true,
    enableMetrics: true,
    retry: {
      enabled: true,
      maxAttempts: 3,
      delay: 1000,
      strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
      exponentialBase: 2,
      maxDelay: 30000,
    },
    circuitBreaker: {
      enabled: false,
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 30000,
    },
  },

  auth: {
    enabled: true,
    requireAll: false,
  },
};

/**
 * PowertoolsConfigService
 *
 * Singleton service for managing and merging powertools config.
 *
 * @method getInstance Get the singleton instance (optionally with initial config)
 * @method getConfig Get the current config
 * @method updateConfig Update config at runtime
 * @method getFeatureConfig Get config for a specific feature
 * @method isFeatureEnabled Check if a feature is enabled
 * @method reset Reset to default config
 * @method validateConfig Validate the config
 */
export class PowertoolsConfigService {
  private static instance: PowertoolsConfigService;
  private config: PowertoolsConfig;

  private constructor(config: PowertoolsConfig = DEFAULT_POWERTOOLS_CONFIG) {
    this.config = this.mergeConfig(DEFAULT_POWERTOOLS_CONFIG, config);
  }

  static getInstance(config?: PowertoolsConfig): PowertoolsConfigService {
    if (!PowertoolsConfigService.instance) {
      PowertoolsConfigService.instance = new PowertoolsConfigService(config);
    }
    return PowertoolsConfigService.instance;
  }

  getConfig(): PowertoolsConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PowertoolsConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
  }

  getFeatureConfig<T extends keyof PowertoolsConfig>(
    feature: T,
  ): PowertoolsConfig[T] {
    return this.config[feature];
  }

  isFeatureEnabled(feature: keyof PowertoolsConfig): boolean {
    const featureConfig = this.config[feature] as any;
    return (
      featureConfig?.enabled !== false && this.config.global?.enabled !== false
    );
  }

  private mergeConfig(
    base: PowertoolsConfig,
    override: Partial<PowertoolsConfig>,
  ): PowertoolsConfig {
    const merged = { ...base };

    Object.keys(override).forEach((key) => {
      const typedKey = key as keyof PowertoolsConfig;
      if (override[typedKey] && typeof override[typedKey] === 'object') {
        merged[typedKey] = { ...base[typedKey], ...override[typedKey] } as any;
      } else {
        merged[typedKey] = override[typedKey] as any;
      }
    });

    return merged;
  }

  reset(): void {
    this.config = { ...DEFAULT_POWERTOOLS_CONFIG };
  }

  validateConfig(): boolean {
    // Add validation logic here
    return true;
  }
}
