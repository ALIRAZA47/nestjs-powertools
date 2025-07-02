# NestJS Powertools

A comprehensive toolkit for building robust, scalable, and maintainable NestJS backends. Includes advanced decorators, guards, hooks, interceptors, pipes, and helpers for authentication, authorization, audit logging, HTTP resilience, validation, rate limiting, caching, and more.

## 🚀 Features

- **Configurable Decorators** for endpoints, roles, permissions, and audit logging
- **Composite Guards** with AND/OR/NOT logic
- **Audit Logging** with MongoDB or in-memory storage
- **Resilient HTTP** (retry, timeout, circuit breaker) as decorators and services
- **Validation Pipes** and helpers
- **Rate Limiting** and caching interceptors
- **OrderBy Field Validation Guard** for safe, flexible sorting in list endpoints
- **Full TypeScript generics and enums** for type safety
- **Extensive configuration options**

## 📦 Installation

```bash
npm install @kitstack/nest-powertools
```

## 🛠️ Usage Overview

### 1. Secure Endpoints with Decorators

```typescript
import { Controller, Get } from '@nestjs/common';
import { SecureEndpoint, DefaultRoles } from '@kitstack/nest-powertools';

@Controller('users')
export class UserController {
  @Get()
  @SecureEndpoint({ roles: [DefaultRoles.ADMIN] })
  async getUsers() {
    // ...
  }
}
```

### 2. Composite Guards

```typescript
import { UseGuards } from '@nestjs/common';
import { CompositeGuardHelper } from '@kitstack/nest-powertools';

const complexGuard = CompositeGuardHelper.And(JwtAuthGuard, RolesGuard);

@UseGuards(complexGuard)
@Get('protected')
async protectedEndpoint() {}
```

### 3. Audit Logging

```typescript
import { EnhancedAudit, AuditAction } from '@kitstack/nest-powertools';

@EnhancedAudit(AuditAction.READ, { resource: 'User' })
@Get('profile')
async getProfile() {}
```

### 4. Resilient HTTP

```typescript
import { ResilientHttp, WithRetry } from '@kitstack/nest-powertools';

@WithRetry(3, 1000)
@Get('external')
async callExternal() {}
```

### 5. OrderBy Field Validation Guard (NEW)

Validate and secure sorting fields in your list endpoints:

```typescript
import { UseGuards, Controller, Get, Query } from '@nestjs/common';
import { OrderByFieldValidationGuard } from '@kitstack/nest-powertools';

@UseGuards(
  OrderByFieldValidationGuard(User, ['email', 'name'], 'createdAt', {
    orderByField: 'sortBy',
  }),
)
@Controller('users')
export class UserController {
  @Get()
  async getUsers(@Query() query: any) {
    // query.sortBy is validated and safe
  }
}
```

- Supports custom field names (e.g., `sortBy`, `sortDir`)
- Works with query or body
- Integrates with TypeORM (auto-detects entity columns)
- Throws clear errors for invalid fields or directions

### 6. Validation Pipes & Helpers

```typescript
import { ValidationPipe } from '@kitstack/nest-powertools';

@UsePipes(new ValidationPipe({ whitelist: true }))
@Post('create')
async createUser(@Body() dto: CreateUserDto) {}
```

### 7. Rate Limiting & Caching

```typescript
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { RateLimitGuard, CacheInterceptor } from '@kitstack/nest-powertools';

@UseGuards(new RateLimitGuard({ max: 10, windowMs: 60000 }))
@UseInterceptors(CacheInterceptor)
@Get('data')
async getData() {}
```

## ⚙️ Configuration

Configure globally or per-feature:

```typescript
import {
  PowertoolsConfigService,
  Environment,
} from '@kitstack/nest-powertools';

PowertoolsConfigService.getInstance({
  global: { environment: Environment.PRODUCTION },
  audit: { enabled: true },
  resilientHttp: { retry: { maxAttempts: 3 } },
});
```

## 🏆 Best Practices

- Always use enums for roles, actions, and status codes
- Use composite guards for complex access logic
- Validate all user input and query parameters
- Use audit logging for sensitive operations
- Prefer decorators for cross-cutting concerns

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Add tests for your changes
4. Open a pull request

## 📄 License

MIT

## 💬 Support & Documentation

- [GitHub Issues](https://github.com/kitstack/nest-powertools/issues)
- [Discussions](https://github.com/kitstack/nest-powertools/discussions)
- [Docs](https://github.com/kitstack/nest-powertools#readme)
