import type { ExecutionContext } from '@nestjs/common';
import type { CustomAuthGuard, GuardRegistry } from '../types';

export class GuardRegistryService {
  private static instance: GuardRegistryService;
  private guards: GuardRegistry = {};

  private constructor() {}

  static getInstance(): GuardRegistryService {
    if (!GuardRegistryService.instance) {
      GuardRegistryService.instance = new GuardRegistryService();
    }
    return GuardRegistryService.instance;
  }

  registerGuard(name: string, guard: CustomAuthGuard): void {
    this.guards[name] = guard;
  }

  getGuard(name: string): CustomAuthGuard | undefined {
    return this.guards[name];
  }

  getAllGuards(): GuardRegistry {
    return { ...this.guards };
  }

  removeGuard(name: string): boolean {
    if (this.guards[name]) {
      delete this.guards[name];
      return true;
    }
    return false;
  }
}

// Built-in custom guards
export class RoleBasedGuard implements CustomAuthGuard {
  constructor(private allowedRoles: string[]) {}

  canActivate(context: ExecutionContext, user: any): boolean {
    if (!user || !user.roles) {
      return false;
    }

    return this.allowedRoles.some((role) => user.roles.includes(role));
  }
}

export class PermissionBasedGuard implements CustomAuthGuard {
  constructor(private requiredPermissions: string[]) {}

  canActivate(context: ExecutionContext, user: any): boolean {
    if (!user || !user.permissions) {
      return false;
    }

    return this.requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );
  }
}

export class OwnershipGuard implements CustomAuthGuard {
  constructor(private resourceIdParam = 'id') {}

  canActivate(context: ExecutionContext, user: any): boolean {
    const request = context.switchToHttp().getRequest();
    const resourceId = request.params[this.resourceIdParam];

    // Check if user owns the resource or is admin
    return user.id === resourceId || user.roles?.includes('admin');
  }
}

export class TimeBasedGuard implements CustomAuthGuard {
  constructor(
    private allowedHours: { start: number; end: number } = {
      start: 9,
      end: 17,
    },
  ) {}

  canActivate(context: ExecutionContext, user: any): boolean {
    const currentHour = new Date().getHours();
    return (
      currentHour >= this.allowedHours.start &&
      currentHour <= this.allowedHours.end
    );
  }
}

// Register built-in guards
const registry = GuardRegistryService.getInstance();
registry.registerGuard('role', new RoleBasedGuard([]));
registry.registerGuard('permission', new PermissionBasedGuard([]));
registry.registerGuard('ownership', new OwnershipGuard());
registry.registerGuard('timeBased', new TimeBasedGuard());
