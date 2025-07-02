# NestJS Powertools

A comprehensive toolkit for building robust, scalable, and maintainable NestJS backends. Includes advanced decorators, guards, hooks, interceptors, pipes, and helpers for authentication, authorization, audit logging, HTTP resilience, validation, rate limiting, caching, and more.

## 🚀 Features

- **Configurable Decorators** for endpoints, roles, permissions, and audit logging
- **Composite Guards** with AND/OR/NOT logic
- **Audit Logging** with MongoDB or file-based storage
- **Resilient HTTP** (retry, timeout, circuit breaker) as decorators and services
- **Validation Pipes** and helpers
- **Rate Limiting** and caching interceptors
- **Sort Field Validation Guard** for safe, flexible sorting in list endpoints
- **Full TypeScript generics and enums** for type safety
- **Extensive configuration options**

## 📦 Installation

```bash
npm install @kitstack/nest-powertools
```

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
      // ...other config
    }),
  ],
})
export class AppModule {}
```

### 2. Audit Logging Storage Options

- **MongoDB**: Set `type: 'mongodb'` and provide `mongoUrl`.
- **File**: Set `type: 'file'` and provide `filePath` (default: `./audit-logs.json`).
- If no storage config is provided, file storage is used by default.

### 3. Example: Using Audit Logs

```typescript
import { Inject, Controller, Get, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor, getAuditStorageFromConfig } from '@kitstack/nest-powertools';

@Controller('users')
@UseInterceptors(AuditInterceptor)
export class UserController {
  constructor(@Inject('AuditStorage') private readonly auditStorage) {}

  @Get()
  async getUsers() {
    // ...
    // You can also use this.auditStorage.save(...) manually if needed
    return [];
  }
}
```

## ⚙️ PowertoolsConfig: All Options

| Option         | Type     | Description |
| -------------- | -------- | ----------- |
| global         | object   | Global settings (enabled, environment, debug, etc.) |
| pagination     | object   | Pagination config (defaultPage, defaultLimit, maxLimit, etc.) |
| cache          | object   | Caching config (strategy, ttl, etc.) |
| validation     | object   | Validation config (strategy, whitelist, etc.) |
| logging        | object   | Logging config (level, includeBody, etc.) |
| rateLimit      | object   | Rate limiting config (strategy, windowMs, max, etc.) |
| audit          | object   | Audit logging config (see below) |
| resilientHttp  | object   | HTTP resilience config (timeout, retry, circuitBreaker, etc.) |
| auth           | object   | Auth config (enabled, requireAll, etc.) |
| custom         | object   | Any custom config |

### Audit Config Options

| Option              | Type     | Description |
| ------------------- | -------- | ----------- |
| enabled             | boolean  | Enable/disable audit logging |
| level               | string   | Audit level (LOW, MEDIUM, HIGH, etc.) |
| includeRequestBody  | boolean  | Include request body in logs |
| includeResponseBody | boolean  | Include response body in logs |
| excludeFields       | string[] | Fields to exclude from logs |
| action              | string   | Default audit action |
| storage             | object   | Storage config (see below) |

#### Audit Storage Config

| Option    | Type   | Description |
| --------- | ------ | ----------- |
| type      | string | 'mongodb' or 'file' |
| mongoUrl  | string | MongoDB connection string (required if type is 'mongodb') |
| filePath  | string | Path to JSON file (used if type is 'file', default: './audit-logs.json') |

## 🧩 Major Classes & Methods

### PowertoolsModule

```typescript
@Module({
  imports: [
    PowertoolsModule.forRoot({ /* config */ })
  ]
})
export class AppModule {}
```
- Use `forRoot(config)` to set global config for all powertools features.

### getAuditStorageFromConfig

Returns the correct audit storage instance (MongoDB or file) based on config.

```typescript
import { getAuditStorageFromConfig } from '@kitstack/nest-powertools';
const auditStorage = getAuditStorageFromConfig();
```

### FileAuditStorage

Stores audit logs in a JSON file. Used automatically if MongoDB is not configured.

**Constructor:**
```typescript
new FileAuditStorage(filePath?: string)
```
- `filePath`: Path to the JSON file (default: './audit-logs.json')

**Methods:**
- `save(entry)`: Save an audit log entry
- `find(filters, pagination)`: Find logs with optional filters and pagination
- `findById(id)`: Find a log by ID
- `count(filters)`: Count logs matching filters
- `delete(id)`: Delete a log by ID
- `deleteMany(filters)`: Delete logs matching filters

### MongoAuditStorage

(Placeholder) Stores audit logs in MongoDB. Used if `type: 'mongodb'` and `mongoUrl` is set in config.

**Constructor:**
```typescript
new MongoAuditStorage()
```
- (You should extend this for your own MongoDB logic.)

**Methods:**
- `save(entry)`: Save an audit log entry
- `find(filters, pagination)`: Find logs with optional filters and pagination
- `findById(id)`: Find a log by ID
- `count(filters)`: Count logs matching filters
- `delete(id)`: Delete a log by ID
- `deleteMany(filters)`: Delete logs matching filters

## 📝 JSDoc & API Reference

All major classes and methods are fully documented with JSDoc in the codebase. See the source for detailed parameter and return type info.

## 🏆 Best Practices

- Use `PowertoolsModule.forRoot()` for global config
- Prefer MongoDB for production audit logs, file for local/dev
- Use enums for roles, actions, and status codes
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
