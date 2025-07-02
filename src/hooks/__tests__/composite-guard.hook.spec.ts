import { CompositeGuard, CompositeGuardHelper } from '../composite-guard.hook';
import { ExecutionContext } from '@nestjs/common';
import { GuardLogic } from '../../types/hooks';

describe('CompositeGuard', () => {
  const createMockGuard = (result: boolean) => ({
    canActivate: jest.fn().mockResolvedValue(result),
  });
  const mockContext = {} as ExecutionContext;

  it('should pass AND logic if all guards pass', async () => {
    const guard = new CompositeGuard({
      guards: [createMockGuard(true), createMockGuard(true)],
      logic: GuardLogic.AND,
      name: 'AndGuard',
    });
    expect(await guard.canActivate(mockContext)).toBe(true);
  });

  it('should fail AND logic if any guard fails', async () => {
    const guard = new CompositeGuard({
      guards: [createMockGuard(true), createMockGuard(false)],
      logic: GuardLogic.AND,
      name: 'AndGuard',
    });
    expect(await guard.canActivate(mockContext)).toBe(false);
  });

  it('should pass OR logic if any guard passes', async () => {
    const guard = new CompositeGuard({
      guards: [createMockGuard(false), createMockGuard(true)],
      logic: GuardLogic.OR,
      name: 'OrGuard',
    });
    expect(await guard.canActivate(mockContext)).toBe(true);
  });

  it('should fail OR logic if all guards fail', async () => {
    const guard = new CompositeGuard({
      guards: [createMockGuard(false), createMockGuard(false)],
      logic: GuardLogic.OR,
      name: 'OrGuard',
    });
    expect(await guard.canActivate(mockContext)).toBe(false);
  });

  it('should invert result for NOT logic', async () => {
    const guard = new CompositeGuard({
      guards: [createMockGuard(true)],
      logic: GuardLogic.NOT,
      name: 'NotGuard',
    });
    expect(await guard.canActivate(mockContext)).toBe(false);
  });

  it('should pass NOT logic if guard fails', async () => {
    const guard = new CompositeGuard({
      guards: [createMockGuard(false)],
      logic: GuardLogic.NOT,
      name: 'NotGuard',
    });
    expect(await guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw for unsupported logic', async () => {
    const guard = new CompositeGuard({
      guards: [],
      logic: 'INVALID' as any,
      name: 'InvalidGuard',
    });
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Unsupported guard logic: INVALID',
    );
  });
});

describe('CompositeGuardHelper', () => {
  it('should create AND, OR, NOT, and Custom guards', () => {
    const andGuard = CompositeGuardHelper.And(
      () => true,
      () => true,
    );
    expect(andGuard).toBeInstanceOf(CompositeGuard);
    const orGuard = CompositeGuardHelper.Or(
      () => true,
      () => false,
    );
    expect(orGuard).toBeInstanceOf(CompositeGuard);
    const notGuard = CompositeGuardHelper.Not(() => false);
    expect(notGuard).toBeInstanceOf(CompositeGuard);
    const customGuard = CompositeGuardHelper.Custom({
      guards: [],
      logic: GuardLogic.AND,
      name: 'Custom',
    });
    expect(customGuard).toBeInstanceOf(CompositeGuard);
  });
});
