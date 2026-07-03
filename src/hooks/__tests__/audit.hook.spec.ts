import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import {
  AuditInterceptor,
  InMemoryAuditStorage,
  MongoAuditStorage,
} from '../audit.hook';
import type { AuditLogEntry } from '../../types/hooks';

describe('Audit Hook', () => {
  describe('InMemoryAuditStorage', () => {
    let storage: InMemoryAuditStorage;
    const entry: AuditLogEntry = {
      userId: '1',
      action: 'CREATE',
      resource: 'Test',
      timestamp: new Date(),
      metadata: {},
    };

    beforeEach(() => {
      storage = new InMemoryAuditStorage();
      storage.clearLogs();
    });

    it('should save and retrieve audit logs', async () => {
      await storage.save(entry);
      const logs = storage.getAllLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].userId).toBe('1');
    });

    it('should find logs by filter', async () => {
      await storage.save(entry);
      const found = await storage.find({ userId: '1' });
      expect(found.length).toBe(1);
    });

    it('should find log by id', async () => {
      await storage.save({ ...entry, userId: '2', resource: 'Other' });
      const logs = storage.getAllLogs();
      const found = await storage.findById(logs[0].id);
      expect(found).toBeDefined();
    });

    it('should clear logs', () => {
      storage.clearLogs();
      expect(storage.getAllLogs().length).toBe(0);
    });
  });

  describe('MongoAuditStorage', () => {
    let storage: MongoAuditStorage;
    const entry: AuditLogEntry = {
      userId: '1',
      action: 'CREATE',
      resource: 'Test',
      timestamp: new Date(),
      metadata: {},
    };

    beforeEach(() => {
      storage = new MongoAuditStorage();
    });

    it('should call save without error (mocked)', async () => {
      await expect(storage.save(entry)).resolves.not.toThrow();
    });
  });

  describe('AuditInterceptor', () => {
    let interceptor: AuditInterceptor;
    let storage: InMemoryAuditStorage;
    let context: Partial<ExecutionContext>;
    let callHandler: Partial<CallHandler>;
    let handler: () => void;

    beforeEach(() => {
      storage = new InMemoryAuditStorage();
      interceptor = new AuditInterceptor(storage);
      handler = () => {};
      context = {
        getHandler: () => handler,
        getClass: () => class TestController {},
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: '1', email: 'test@test.com' },
            ip: '127.0.0.1',
            headers: { 'user-agent': 'jest' },
            url: '/test',
            method: 'GET',
            body: { foo: 'bar' },
            params: { id: '1' },
          }),
          getResponse: () => ({ statusCode: 200 }),
        }),
      } as any;
      callHandler = { handle: () => of('response') };
    });

    it('should intercept and save audit log', (done) => {
      Reflect.defineMetadata('audit-config', { action: 'READ' }, handler);
      interceptor
        .intercept(context as ExecutionContext, callHandler as CallHandler)
        .subscribe(() => {
          expect(storage.getAllLogs().length).toBe(1);
          done();
        });
    });

    it('should skip if no audit config', (done) => {
      interceptor
        .intercept(context as ExecutionContext, callHandler as CallHandler)
        .subscribe((res) => {
          expect(res).toBe('response');
          expect(storage.getAllLogs().length).toBe(0);
          done();
        });
    });
  });
});
