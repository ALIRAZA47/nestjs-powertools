# NestJS Powertools

A comprehensive toolkit for building robust, scalable, and maintainable NestJS backends. Includes advanced decorators, guards, hooks, interceptors, pipes, and helpers for authentication, authorization, audit logging, HTTP resilience, validation, rate limiting, caching, and more.

---

## 📚 Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [PowertoolsModule & Global Config](#powertoolsmodule--global-config)
- [Decorators](#decorators)
- [Guards](#guards)
- [Interceptors](#interceptors)
- [Hooks](#hooks)
- [Parameter Extractors](#parameter-extractors)
- [Helpers](#helpers)
- [Audit Logging Storage](#audit-logging-storage)
- [API Reference & JSDoc](#api-reference--jsdoc)
- [Best Practices](#best-practices)
- [Contributing](#contributing)
- [License](#license)
- [Support & Documentation](#support--documentation)

---

## 🚀 Features
- **Configurable Decorators** for endpoints, roles, permissions, and audit logging
- **Composite Guards** with AND/OR/NOT logic
- **Audit Logging** with MongoDB or file-based storage
- **Lightweight in-memory audit option for testing or small apps**
- **Resilient HTTP** (retry, timeout, circuit breaker) as decorators and services
- **Validation Pipes** and helpers
- **Rate Limiting** and caching interceptors
- **Sort Field Validation Guard** for safe, flexible sorting in list endpoints
- **Full TypeScript generics and enums** for type safety
- **Extensive configuration options**

---

## 📦 Installation
```bash
npm install @kitstack/nest-powertools
```

---

## 🛠️ Quick Start
### 1. Global Setup with PowertoolsModule
```typescript
import { Module } from '@nestjs/common';
import { PowertoolsModule } from '@kitstack/nest-powertools';

@Module({
  imports: [
    PowertoolsModule.forRoot({
      audit: {
        enabled: true,
        storage: {
          type: 'mongodb', // or 'file'
          mongoUrl: 'mongodb://localhost:27017/auditlogs', // for MongoDB
          filePath: './audit-logs.json', // for file storage
        },
        level: 'HIGH',
        includeRequestBody: true,
      },
      resilientHttp: {
        timeout: 10000,
        retry: { maxAttempts: 3 },
        circuitBreaker: { failureThreshold: 5, resetTimeout: 60000 },
      },
      rateLimit: {
        max: 100,
        windowMs: 60000,
        strategy: 'delay',
      },
      // ...other config
    }),
  ],
})
export class AppModule {}
```

---

## 🧩 PowertoolsModule & Global Config

- Use `PowertoolsModule.forRoot(config)` to set global config for all powertools features.
- All features (audit, resilientHttp, rateLimit, cache, validation, etc.) can be configured globally here.

### Example
```typescript
@Module({
  imports: [
    PowertoolsModule.forRoot({
      audit: { enabled: true, ... },
      resilientHttp: { ... },
      rateLimit: { ... },
      // ...
    })
  ]
})
export class AppModule {}
```

---

## 🏷️ Decorators

### SecureEndpoint, AdminOnly, UserEndpoint, RequireRoles, RequirePermissions, PowerEndpoint, CrudEndpoint, UseCustomGuard

- **Purpose:** Secure endpoints with roles, permissions, custom logic, audit, validation, rate limiting, caching, and more.
- **Usage:**
```typescript
@SecureEndpoint<User, UserResponse>({
  roles: [DefaultRoles.ADMIN],
  customValidator: async (user, ctx) => user.department === 'finance',
  description: 'Access sensitive data',
  responses: [
    { status: HttpStatusCodes.OK, description: 'Success', type: UserResponse },
    { status: HttpStatusCodes.FORBIDDEN, description: 'Forbidden' },
  ]
})
@Get('sensitive')
async getSensitive(@CurrentUser() user: User) { ... }

@AdminOnly('Delete user', UserResponse)
@Delete('admin/users/:id')
async deleteUser(@Param('id') id: string) { ... }

@RequireRoles([DefaultRoles.MODERATOR, DefaultRoles.ADMIN], 'Moderate', ModeratorAction)
@Post('moderate')
async moderate(@Body() dto: Dto) { ... }

@RequirePermissions(['reports:read', 'financial:access'], 'Access reports', Report)
@Get('reports')
async getReports() { ... }

@PowerEndpoint<User, CreateOrderResponse, OrderAuditMetadata>({
  auth: { roles: [DefaultRoles.USER] },
  audit: { action: AuditAction.CREATE, resource: 'Order' },
  resilientHttp: { timeout: 15000 },
  rateLimit: { max: 10, windowMs: 60000 },
  validation: { transform: true, whitelist: true },
  description: 'Create order',
  responseType: CreateOrderResponse,
  responses: [
    { status: HttpStatusCodes.CREATED, description: 'Order created', type: CreateOrderResponse },
    { status: HttpStatusCodes.BAD_REQUEST, description: 'Invalid data' },
  ]
})
@Post('orders')
async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: User) { ... }
```

---

## 🛡️ Guards

### ConfigurableAuthGuard
- **Purpose:** Flexible, multi-strategy authentication/authorization (roles, permissions, custom logic).
- **Usage:**
```typescript
@UseGuards(ConfigurableAuthGuard)
@Get('secure')
@Auth({ roles: ['admin'], permissions: ['data:read'] })
async getSecure() { ... }
```

#### Advanced Customization Examples

**Custom Validator (business logic):**
```typescript
@UseGuards(ConfigurableAuthGuard)
@Get('department-data')
@Auth({
  roles: ['user'],
  customValidator: async (user, context) => {
    const requestedDept = context.switchToHttp().getRequest().query.department;
    return user.department === requestedDept || user.roles.includes('admin');
  }
})
async getDepartmentData(@Query('department') dept: string) {
  // User can access their own department data or admin can access any
}
```

**Custom Guard Object:**
```typescript
const resourceOwnerGuard = {
  canActivate: async (context, user) => {
    const resourceId = context.switchToHttp().getRequest().params.id;
    // Custom logic: only allow if user owns the resource
    return await checkResourceOwnership(user.id, resourceId);
  }
};

@UseGuards(ConfigurableAuthGuard)
@Put('resource/:id')
@Auth({
  guard: resourceOwnerGuard,
  roles: ['admin'] // Fallback: admins can always access
})
async updateResource(@Param('id') id: string) {
  // Resource owner or admin can update
}
```

**Require All (roles + permissions):**
```typescript
@UseGuards(ConfigurableAuthGuard)
@Get('sensitive')
@Auth({
  roles: ['manager'],
  permissions: ['sensitive:read'],
  requireAll: true // User must have BOTH role and permission
})
async getSensitive() { ... }
```

**Public endpoint (no auth):**
```typescript
@Get('public')
@Auth({}) // No roles/permissions required
async getPublic() { ... }
```

### JwtAuthGuard
- **Purpose:** JWT authentication with public endpoint support.
- **Usage:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('private')
async getPrivate(@CurrentUser() user: User) { ... }

@Get('public')
@Public()
async getPublic() { ... }
```

### RateLimitGuard
- **Purpose:** Intelligent rate limiting (delay or reject strategy).
- **Usage:**
```typescript
@UseGuards(new RateLimitGuard({ max: 5, windowMs: 60000, strategy: 'delay' }))
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

### RolesGuard
- **Purpose:** Restrict access based on user roles.
- **Usage:**
```typescript
@UseGuards(RolesGuard)
@Roles('admin', 'moderator')
@Get('admin/users')
async getUsers() { ... }
```

### SortFieldValidationGuard
- **Purpose:** Validate sort/order fields for list endpoints (supports TypeORM and custom fields).
- **Usage:**
```typescript
@UseGuards(SortFieldValidationGuard(User, ['email', 'name'], 'createdAt', { orderByField: 'sortBy' }))
@Get('users')
async getUsers(@Query() query: any) { ... }
```

### CompositeGuard
- **Purpose:** Combine multiple guards with AND/OR/NOT logic.
- **Usage:**
```typescript
@UseGuards(CompositeGuardHelper.And(JwtAuthGuard, RolesGuard))
@Get('and-protected')
async andProtected() { ... }

@UseGuards(CompositeGuardHelper.Or(JwtAuthGuard, RateLimitGuard))
@Get('or-protected')
async orProtected() { ... }

@UseGuards(CompositeGuardHelper.Not(RolesGuard))
@Get('not-protected')
async notProtected() { ... }
```

---

## 🌀 Interceptors

### CacheInterceptor
- **Purpose:** In-memory response caching with TTL and custom keys.
- **Usage:**
```typescript
@UseInterceptors(CacheInterceptor)
@Get('expensive')
async expensive() { ... }

@UseInterceptors(new CacheInterceptor({ ttl: 60000 }))
@Get('frequent')
async frequent() { ... }
```

### LoggingInterceptor
- **Purpose:** Logs HTTP requests/responses with timing.
- **Usage:**
```typescript
@UseInterceptors(LoggingInterceptor)
@Get('log')
async log() { ... }
```

### ResilientHttpInterceptor
- **Purpose:** Adds retry, timeout, and circuit breaker to HTTP requests.
- **Usage:**
```typescript
@UseInterceptors(ResilientHttpInterceptor)
@Get('external')
@ResilientHttp({ timeout: 10000, retry: { maxAttempts: 3 } })
async callExternal() { ... }
```

### TransformInterceptor
- **Purpose:** Standardizes API responses (success, data, timestamp).
- **Usage:**
```typescript
@UseInterceptors(TransformInterceptor)
@Get('user')
async getUser() { ... }
```

### ValidationPipe
- **Purpose:** Robust request validation using class-validator and class-transformer.
- **Usage:**
```typescript
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Post('users')
async createUser(@Body() userData: CreateUserDto) { ... }
```

---

## 🪝 Hooks

### AuditInterceptor & Audit Decorators
- **Purpose:** Persistent audit logging for sensitive operations.
- **Usage:**
```typescript
@UseInterceptors(AuditInterceptor)
@Post('orders')
@Audit(AuditAction.CREATE, { resource: 'Order', level: AuditLevel.HIGH, includeRequestBody: true })
async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: User) { ... }

@AuditRead('SensitiveData', { condition: (ctx, user) => user.isAdmin })
@Get('sensitive-data/:id')
async getSensitiveData(@Param('id') id: string) { ... }
```
For minimal setups you can use `SimpleAuditInterceptor` and `SimpleAudit`.
These are exported from `@kitstack/nest-powertools` for a lightweight,
in-memory audit implementation.

### CompositeGuard (see Guards section)

### ResilientHttpService & CircuitBreaker
- **Purpose:** Programmatic HTTP calls with resilience (retry, timeout, circuit breaker).
- **Usage:**
```typescript
constructor(private resilientHttp: ResilientHttpService) {}

this.resilientHttp.get('https://api.example.com/data', { timeout: 5000, retry: { maxAttempts: 2 } })
  .subscribe(response => { ... });
```

### OrderByField (SortFieldValidationGuard)
- **Purpose:** See Guards section for usage.

---

## 🧲 Parameter Extractors

### Pagination, CurrentUser, UserAgent, IpAddress
- **Purpose:** Extract and validate common parameters from requests.
- **Usage:**
```typescript
@Get('users')
@Pagination({ defaultLimit: 20, maxLimit: 100, allowedSortFields: ['name', 'email'] })
async getUsers(pagination: EnhancedPaginationQuery) { ... }

@Get('profile')
async getProfile(@CurrentUser() user: User) { ... }

@Post('analytics')
async track(@UserAgent() userAgent: string, @IpAddress() ip: string) { ... }
```

---

## 🛠️ Helpers
- **GuardHelper:** Register and use custom guards by name.
- **ResponseFormatter:** Standardize API responses.
- **ValidationHelper:** Utilities for DTO/class validation.

---

## 🗄️ Audit Logging Storage

### SimpleInMemoryAuditStorage
- Stores logs in-memory for quick tests or ephemeral setups.
- **Constructor:**
```typescript
new SimpleInMemoryAuditStorage()
```

### FileAuditStorage
- Stores audit logs in a JSON file. Used automatically if MongoDB is not configured.
- **Constructor:**
```typescript
new FileAuditStorage(filePath?: string)
```
- **Methods:**
  - `save(entry)`, `find(filters, pagination)`, `findById(id)`, `count(filters)`, `delete(id)`, `deleteMany(filters)`

### MongoAuditStorage
- (Placeholder) Stores audit logs in MongoDB. Used if `type: 'mongodb'` and `mongoUrl` is set in config.
- **Constructor:**
```typescript
new MongoAuditStorage()
```
- **Methods:**
  - `save(entry)`, `find(filters, pagination)`, `findById(id)`, `count(filters)`, `delete(id)`, `deleteMany(filters)`

---

## 📝 API Reference & JSDoc

All major classes and methods are fully documented with JSDoc in the codebase. See the source for detailed parameter and return type info.

---

## 🏆 Best Practices
- Use `PowertoolsModule.forRoot()` for global config
- Prefer MongoDB for production audit logs, file for local/dev
- Use enums for roles, actions, and status codes
- Use composite guards for complex access logic
- Validate all user input and query parameters
- Use audit logging for sensitive operations
- Prefer decorators for cross-cutting concerns

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch
3. Add tests for your changes
4. Open a pull request

---

## 📄 License
MIT

---

## 💬 Support & Documentation
- [GitHub Issues](https://github.com/kitstack/nest-powertools/issues)
- [Discussions](https://github.com/kitstack/nest-powertools/discussions)
- [Docs](https://github.com/kitstack/nest-powertools#readme)
