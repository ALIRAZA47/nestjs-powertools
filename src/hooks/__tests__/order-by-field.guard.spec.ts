import { OrderByFieldValidationGuard } from '../order-by-field.guard';
import { ExecutionContext, BadRequestException } from '@nestjs/common';

describe('OrderByFieldValidationGuard', () => {
  const getContext = (query: any = {}, body: any = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ query, body }),
      }),
    }) as unknown as ExecutionContext;

  it('allows valid orderBy from allowedFields', async () => {
    const Guard = OrderByFieldValidationGuard(undefined, ['foo', 'bar']);
    const context = getContext({ orderBy: 'foo' });
    await expect(new Guard().canActivate(context)).resolves.toBe(true);
  });

  it('rejects invalid orderBy', async () => {
    const Guard = OrderByFieldValidationGuard(undefined, ['foo']);
    const context = getContext({ orderBy: 'baz' });
    await expect(new Guard().canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('sets default orderBy if not provided', async () => {
    const Guard = OrderByFieldValidationGuard(undefined, ['foo'], 'foo');
    const query: any = {};
    const context = getContext(query);
    await new Guard().canActivate(context);
    expect(query.orderBy).toBe('foo');
  });

  it('validates orderDir values', async () => {
    const Guard = OrderByFieldValidationGuard();
    for (const val of ['ASC', 'DESC', 'asc', 'desc', 1, -1]) {
      const context = getContext({ orderDir: val });
      await expect(new Guard().canActivate(context)).resolves.toBe(true);
    }
    const context = getContext({ orderDir: 'bad' });
    await expect(new Guard().canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('supports custom field names', async () => {
    const Guard = OrderByFieldValidationGuard(undefined, ['foo'], 'foo', {
      orderByField: 'sortBy',
      orderDirField: 'sortDir',
    });
    const context = getContext({ sortBy: 'foo', sortDir: 'ASC' });
    await expect(new Guard().canActivate(context)).resolves.toBe(true);
  });

  it('works with body fields', async () => {
    const Guard = OrderByFieldValidationGuard(undefined, ['foo']);
    const context = getContext({}, { orderBy: 'foo', orderDir: 'DESC' });
    await expect(new Guard().canActivate(context)).resolves.toBe(true);
  });

  it('works without entity', async () => {
    const Guard = OrderByFieldValidationGuard();
    const context = getContext({ orderBy: 'id' });
    await expect(new Guard().canActivate(context)).resolves.toBe(true);
  });

  it('allows entity columns if TypeORM present', async () => {
    // Mock TypeORM getMetadataArgsStorage
    jest.resetModules();
    jest.doMock('typeorm', () => ({
      getMetadataArgsStorage: () => ({
        columns: [{ target: class User {}, propertyName: 'username' }],
      }),
    }));
    const User = class User {};
    const Guard = OrderByFieldValidationGuard(User);
    const context = getContext({ orderBy: 'username' });
    await expect(new Guard().canActivate(context)).resolves.toBe(true);
    jest.dontMock('typeorm');
  });
});
