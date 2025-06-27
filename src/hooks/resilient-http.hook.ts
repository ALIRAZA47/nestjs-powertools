import { Injectable, Logger } from '@nestjs/common';
import type { HttpService } from '@nestjs/axios';
import { Observable, throwError } from 'rxjs';
import {
  catchError,
  delay,
  retryWhen,
  scan,
  timeout,
  tap,
} from 'rxjs/operators';
import { of } from 'rxjs';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  ResilientHttpConfig,
  RetryConfig,
  CircuitBreakerConfig,
  CircuitBreakerState,
  CircuitBreakerStats,
  HttpRequestMetrics,
} from '../types/hooks';

@Injectable()
export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED' as CircuitBreakerState;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private readonly logger = new Logger(CircuitBreaker.name);

  constructor(private config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 30000, // 30 seconds
      ...config,
    };
  }

  async execute<T>(operation: () => Observable<T>): Promise<Observable<T>> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN' as CircuitBreakerState;
        this.logger.log('Circuit breaker moving to HALF_OPEN state');
      } else {
        return this.handleOpenCircuit();
      }
    }

    return operation().pipe(
      tap(() => this.onSuccess()),
      catchError((error) => {
        this.onFailure();
        return throwError(() => error);
      }),
    );
  }

  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false;
    }
    return Date.now() >= this.nextAttemptTime.getTime();
  }

  private handleOpenCircuit<T>(): Observable<T> {
    const error = new Error('Circuit breaker is OPEN');
    if (this.config.fallbackHandler) {
      try {
        const fallbackResult = this.config.fallbackHandler(error);
        return of(fallbackResult);
      } catch (fallbackError) {
        return throwError(() => fallbackError);
      }
    }
    return throwError(() => error);
  }

  private onSuccess(): void {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED' as CircuitBreakerState;
      this.failureCount = 0;
      this.logger.log('Circuit breaker reset to CLOSED state');
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN' as CircuitBreakerState;
      this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout!);
      this.logger.warn('Circuit breaker opened from HALF_OPEN state');
    } else if (this.failureCount >= this.config.failureThreshold!) {
      this.state = 'OPEN' as CircuitBreakerState;
      this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout!);
      this.logger.warn(
        `Circuit breaker opened after ${this.failureCount} failures`,
      );
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  reset(): void {
    this.state = 'CLOSED' as CircuitBreakerState;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.logger.log('Circuit breaker manually reset');
  }
}

@Injectable()
export class ResilientHttpService {
  private readonly logger = new Logger(ResilientHttpService.name);
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private metrics: HttpRequestMetrics[] = [];

  constructor(private httpService: HttpService) {}

  get<T = any>(
    url: string,
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeRequest('GET', url, undefined, config);
  }

  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeRequest('POST', url, data, config);
  }

  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeRequest('PUT', url, data, config);
  }

  delete<T = any>(
    url: string,
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeRequest('DELETE', url, undefined, config);
  }

  patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): Observable<AxiosResponse<T>> {
    return this.makeRequest('PATCH', url, data, config);
  }

  private makeRequest<T = any>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): Observable<AxiosResponse<T>> {
    const startTime = Date.now();
    const resilientConfig = this.extractResilientConfig(config);
    const axiosConfig = this.extractAxiosConfig(config);

    let request: Observable<AxiosResponse<T>>;

    switch (method.toUpperCase()) {
      case 'GET':
        request = this.httpService.get(url, axiosConfig);
        break;
      case 'POST':
        request = this.httpService.post(url, data, axiosConfig);
        break;
      case 'PUT':
        request = this.httpService.put(url, data, axiosConfig);
        break;
      case 'DELETE':
        request = this.httpService.delete(url, axiosConfig);
        break;
      case 'PATCH':
        request = this.httpService.patch(url, data, axiosConfig);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    // Apply timeout
    if (resilientConfig.timeout) {
      request = request.pipe(timeout(resilientConfig.timeout));
    }

    // Apply retry logic
    if (resilientConfig.retry) {
      request = this.applyRetryLogic(request, resilientConfig.retry);
    }

    // Apply circuit breaker
    if (resilientConfig.circuitBreaker) {
      const circuitBreaker = this.getOrCreateCircuitBreaker(
        url,
        resilientConfig.circuitBreaker,
      );
      request = circuitBreaker.execute(() => request) as unknown as Observable<
        AxiosResponse<T>
      >;
    }

    // Add logging and metrics
    return request.pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        this.recordMetrics(url, method, duration, true, response.status);
        if (resilientConfig.enableLogging) {
          this.logger.log(
            `${method} ${url} - ${response.status} (${duration}ms)`,
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.recordMetrics(
          url,
          method,
          duration,
          false,
          error.response?.status,
          error.message,
        );
        if (resilientConfig.enableLogging) {
          this.logger.error(
            `${method} ${url} - Error: ${error.message} (${duration}ms)`,
          );
        }
        return throwError(() => error);
      }),
    );
  }

  private applyRetryLogic<T>(
    request: Observable<T>,
    retryConfig: RetryConfig,
  ): Observable<T> {
    const config = {
      maxAttempts: 3,
      delay: 1000,
      exponentialBackoff: true,
      retryCondition: (error: any) =>
        error.response?.status >= 500 || error.code === 'ECONNRESET',
      ...retryConfig,
    };

    return request.pipe(
      retryWhen((errors) =>
        errors.pipe(
          scan((retryCount, error) => {
            if (
              retryCount >= config.maxAttempts! ||
              !config.retryCondition!(error)
            ) {
              throw error;
            }
            return retryCount + 1;
          }, 0),
          delay(config.delay),
        ),
      ),
    );
  }

  private getOrCreateCircuitBreaker(
    url: string,
    config: CircuitBreakerConfig,
  ): CircuitBreaker {
    const key = this.getCircuitBreakerKey(url);
    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker(config));
    }
    return this.circuitBreakers.get(key)!;
  }

  private getCircuitBreakerKey(url: string): string {
    // Extract base URL for circuit breaker grouping
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.host}`;
    } catch {
      return url;
    }
  }

  private extractResilientConfig(
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): ResilientHttpConfig {
    if (!config) return {};

    const { timeout, retry, circuitBreaker, enableLogging, ...axiosConfig } =
      config;
    return { timeout, retry, circuitBreaker, enableLogging };
  }

  private extractAxiosConfig(
    config?: AxiosRequestConfig & ResilientHttpConfig,
  ): AxiosRequestConfig {
    if (!config) return {};

    const { timeout, retry, circuitBreaker, enableLogging, ...axiosConfig } =
      config;
    return axiosConfig;
  }

  private recordMetrics(
    url: string,
    method: string,
    duration: number,
    success: boolean,
    statusCode?: number,
    error?: string,
  ): void {
    const metric: HttpRequestMetrics = {
      url,
      method,
      duration,
      success,
      statusCode,
      error,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Public methods for monitoring
  getCircuitBreakerStats(url?: string): CircuitBreakerStats[] {
    if (url) {
      const key = this.getCircuitBreakerKey(url);
      const circuitBreaker = this.circuitBreakers.get(key);
      return circuitBreaker ? [circuitBreaker.getStats()] : [];
    }

    return Array.from(this.circuitBreakers.values()).map((cb) => cb.getStats());
  }

  getMetrics(limit = 100): HttpRequestMetrics[] {
    return this.metrics.slice(-limit);
  }

  resetCircuitBreaker(url: string): void {
    const key = this.getCircuitBreakerKey(url);
    const circuitBreaker = this.circuitBreakers.get(key);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}
