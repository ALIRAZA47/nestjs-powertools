import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { CompositeGuardConfig, GuardLogic } from '../types/hooks';

@Injectable()
export class CompositeGuard implements CanActivate {
  constructor(private config: CompositeGuardConfig) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { guards, logic } = this.config;

    switch (logic) {
      case 'AND':
        return this.evaluateAnd(guards, context);
      case 'OR':
        return this.evaluateOr(guards, context);
      case 'NOT':
        return this.evaluateNot(guards, context);
      default:
        throw new Error(`Unsupported guard logic: ${logic}`);
    }
  }

  private async evaluateAnd(
    guards: any[],
    context: ExecutionContext,
  ): Promise<boolean> {
    for (const guard of guards) {
      const guardInstance = this.createGuardInstance(guard);
      const result = await guardInstance.canActivate(context);
      if (!result) {
        return false;
      }
    }
    return true;
  }

  private async evaluateOr(
    guards: any[],
    context: ExecutionContext,
  ): Promise<boolean> {
    for (const guard of guards) {
      const guardInstance = this.createGuardInstance(guard);
      const result = await guardInstance.canActivate(context);
      if (result) {
        return true;
      }
    }
    return false;
  }

  private async evaluateNot(
    guards: any[],
    context: ExecutionContext,
  ): Promise<boolean> {
    // NOT logic applies to the first guard only
    if (guards.length === 0) {
      return true;
    }

    const guardInstance = this.createGuardInstance(guards[0]);
    const result = await guardInstance.canActivate(context);
    return !result;
  }

  private createGuardInstance(guard: any): CanActivate {
    if (typeof guard === 'function') {
      return new guard();
    }
    return guard;
  }
}

// Helper functions for creating composite guards
export class CompositeGuardHelper {
  /**
   * Create an AND composite guard - all guards must pass
   */
  static And(...guards: any[]): CompositeGuard {
    return new CompositeGuard({
      guards,
      logic: 'AND' as GuardLogic,
      name: 'AndGuard',
    });
  }

  /**
   * Create an OR composite guard - at least one guard must pass
   */
  static Or(...guards: any[]): CompositeGuard {
    return new CompositeGuard({
      guards,
      logic: 'OR' as GuardLogic,
      name: 'OrGuard',
    });
  }

  /**
   * Create a NOT composite guard - inverts the result of the first guard
   */
  static Not(guard: any): CompositeGuard {
    return new CompositeGuard({
      guards: [guard],
      logic: 'NOT' as GuardLogic,
      name: 'NotGuard',
    });
  }

  /**
   * Create a custom composite guard with specific configuration
   */
  static Custom(config: CompositeGuardConfig): CompositeGuard {
    return new CompositeGuard(config);
  }
}
