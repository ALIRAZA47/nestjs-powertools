import type { ExecutionContext } from '@nestjs/common';

/**
 * Default user roles enumeration
 *
 * @description Provides standard role definitions that can be used across the application
 * for role-based access control. These can be extended with custom roles as needed.
 */
export enum DefaultRoles {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest',
  SUPER_ADMIN = 'super_admin',
  EDITOR = 'editor',
  MANAGER = 'manager',
}

/**
 * Custom authentication guard interface
 *
 * @description Defines the contract for custom authentication guards that can be used
 * with the Auth decorator. Guards implement business-specific authorization logic.
 */
export interface CustomAuthGuard {
  /**
   * Determines if the current request should be allowed to proceed
   *
   * @param context - The execution context containing request information
   * @param user - The authenticated user object
   * @param requiredPermissions - Optional array of required permissions
   * @returns Boolean or Promise<boolean> indicating if access should be granted
   */
  canActivate(
    context: ExecutionContext,
    user: any,
    requiredPermissions?: string[],
  ): boolean | Promise<boolean>;
}

/**
 * Authentication configuration interface
 *
 * @description Comprehensive configuration object for the Auth decorator,
 * supporting multiple authorization strategies and custom validation logic.
 */
export interface AuthConfig {
  /** Custom guard instance for specialized authorization logic */
  guard?: CustomAuthGuard;

  /** Array of required user roles (user needs at least one) */
  roles?: string[] | DefaultRoles[];

  /** Array of required permissions (user needs all) */
  permissions?: string[];

  /** Custom validation function for complex business logic */
  customValidator?: (
    user: any,
    context: ExecutionContext,
  ) => boolean | Promise<boolean>;

  /** Whether user must meet ALL criteria (default: false) */
  requireAll?: boolean;
}

/**
 * Guard registry for storing and retrieving named guards
 *
 * @description Registry pattern implementation for managing custom guards
 * that can be reused across multiple endpoints.
 */
export interface GuardRegistry {
  [key: string]: CustomAuthGuard;
}

/**
 * Guard registry service for managing custom guards
 *
 * @description Singleton service that manages the registration and retrieval
 * of custom authentication guards.
 */
export class GuardRegistryService {
  private static instance: GuardRegistryService;
  private guards: GuardRegistry = {};

  /**
   * Get the singleton instance of the guard registry
   */
  static getInstance(): GuardRegistryService {
    if (!GuardRegistryService.instance) {
      GuardRegistryService.instance = new GuardRegistryService();
    }
    return GuardRegistryService.instance;
  }

  /**
   * Register a custom guard with a name
   *
   * @param name - Unique name for the guard
   * @param guard - The guard implementation
   */
  registerGuard(name: string, guard: CustomAuthGuard): void {
    this.guards[name] = guard;
  }

  /**
   * Retrieve a registered guard by name
   *
   * @param name - Name of the guard to retrieve
   * @returns The registered guard
   * @throws Error if guard is not found
   */
  getGuard(name: string): CustomAuthGuard {
    const guard = this.guards[name];
    if (!guard) {
      throw new Error(
        `Guard '${name}' not found in registry. Available guards: ${Object.keys(this.guards).join(', ')}`,
      );
    }
    return guard;
  }

  /**
   * Get all registered guard names
   *
   * @returns Array of registered guard names
   */
  getRegisteredGuards(): string[] {
    return Object.keys(this.guards);
  }

  /**
   * Check if a guard is registered
   *
   * @param name - Name of the guard to check
   * @returns True if guard exists
   */
  hasGuard(name: string): boolean {
    return name in this.guards;
  }

  /**
   * Remove a guard from the registry
   *
   * @param name - Name of the guard to remove
   * @returns True if guard was removed, false if it didn't exist
   */
  unregisterGuard(name: string): boolean {
    if (this.hasGuard(name)) {
      delete this.guards[name];
      return true;
    }
    return false;
  }

  /**
   * Clear all registered guards
   */
  clearAll(): void {
    this.guards = {};
  }
}
