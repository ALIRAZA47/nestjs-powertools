import { CircuitBreaker, ResilientHttpService } from '../resilient-http.hook';
import { CircuitBreakerState } from '../../types/hooks';
import { of, throwError, lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

describe('CircuitBreaker', () => {
  const config = { failureThreshold: 2, resetTimeout: 100 };
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(config);
  });

  it('should start in CLOSED state', () => {
    expect(breaker.getStats().state).toBe(CircuitBreakerState.CLOSED);
  });

  it('should open after failures', async () => {
    const failingOp = () => throwError(() => new Error('fail'));
    await lastValueFrom(
      (await breaker.execute(failingOp)).pipe(catchError(() => of(undefined))),
    );
    await lastValueFrom(
      (await breaker.execute(failingOp)).pipe(catchError(() => of(undefined))),
    );
    expect(breaker.getStats().state).toBe(CircuitBreakerState.OPEN);
  });

  it('should reset to CLOSED after success in HALF_OPEN', async () => {
    const failingOp = () => throwError(() => new Error('fail'));
    await lastValueFrom(
      (await breaker.execute(failingOp)).pipe(catchError(() => of(undefined))),
    );
    await lastValueFrom(
      (await breaker.execute(failingOp)).pipe(catchError(() => of(undefined))),
    );
    // Simulate time passing for reset
    (breaker as any).nextAttemptTime = new Date(Date.now() - 1);
    const successOp = () => of('ok');
    await lastValueFrom(await breaker.execute(successOp));
    expect(breaker.getStats().state).toBe(CircuitBreakerState.CLOSED);
  });

  it('should use fallback handler if provided', async () => {
    const fallbackBreaker = new CircuitBreaker({
      ...config,
      fallbackHandler: () => 'fallback',
    });
    (fallbackBreaker as any).state = CircuitBreakerState.OPEN;
    (fallbackBreaker as any).nextAttemptTime = new Date(Date.now() + 1000);
    const result = await lastValueFrom(
      await fallbackBreaker.execute(() => throwError(() => new Error('fail'))),
    );
    expect(result).toBe('fallback');
  });
});

describe('ResilientHttpService', () => {
  let service: ResilientHttpService;
  let httpService: any;

  beforeEach(() => {
    httpService = {
      get: jest.fn(() => of({ data: 'ok' })),
      post: jest.fn(() => of({ data: 'ok' })),
      put: jest.fn(() => of({ data: 'ok' })),
      delete: jest.fn(() => of({ data: 'ok' })),
      patch: jest.fn(() => of({ data: 'ok' })),
    };
    service = new ResilientHttpService(httpService);
  });

  it('should make GET request', (done) => {
    service.get('url').subscribe((res) => {
      expect(res.data).toBe('ok');
      done();
    });
  });

  it('should make POST request', (done) => {
    service.post('url', { foo: 'bar' }).subscribe((res) => {
      expect(res.data).toBe('ok');
      done();
    });
  });

  it('should record metrics', () => {
    service.get('url').subscribe();
    expect(service.getMetrics().length).toBeGreaterThan(0);
  });

  it('should reset circuit breaker', () => {
    service.get('url').subscribe();
    service.resetCircuitBreaker('url');
    // No error should occur
  });

  it('should clear metrics', () => {
    service.get('url').subscribe();
    service.clearMetrics();
    expect(service.getMetrics().length).toBe(0);
  });
});
