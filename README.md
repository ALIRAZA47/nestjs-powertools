# @kitstack/nest-powertools

A comprehensive collection of NestJS powertools, decorators, and utilities to supercharge your backend development with **full TypeScript generics support**, **comprehensive enums**, and **extensive configuration options**.

## Installation

\`\`\`bash
npm install @kitstack/nest-powertools
\`\`\`

## 🚀 Key Features

- 🔧 **Powertools**: Pre-configured decorator combinations for common use cases
- 🎯 **Full Generic Support**: Type-safe responses and configurations
- 📋 **Comprehensive Enums**: Replace all hardcoded values with maintainable enums
- ⚙️ **Extensive Configuration**: Customize every aspect of the package behavior
- 🔐 **Configurable Authentication**: Flexible auth system with custom guards
- 🛡️ **Composite Guards**: Combine multiple guards with AND, OR, NOT logic
- 📊 **Pagination**: Built-in pagination helpers and decorators
- 🔍 **Audit Logging**: Automatic user action tracking with MongoDB storage
- 🚀 **Resilient HTTP**: Retry logic, timeouts, and circuit breaker patterns **AS DECORATORS**
- 🛡️ **Validation**: Enhanced validation pipes with customizable options
- 📝 **Logging**: Request/response logging interceptors
- 🚦 **Rate Limiting**: Configurable rate limiting guards
- 💾 **Caching**: Simple in-memory caching interceptors

## 🎯 Quick Start with Generics

\`\`\`typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import {
SecureEndpoint,
EnhancedResponseHelper,
DefaultRoles,
HttpStatusCodes,
ResponseStatus,
ApiResponse
} from '@kitstack/nest-powertools';

// Define your types
interface User {
id: string;
email: string;
name: string;
}

interface CreateUserDto {
email: string;
name: string;
password: string;
}

@Controller('users')
export class UserController {
@Get()
@SecureEndpoint<User, User[]>({
roles: [DefaultRoles.ADMIN],
description: 'Get all users',
responses: [
{
status: HttpStatusCodes.OK,
description: 'Users retrieved successfully',
type: Array<User>
}
]
})
async getUsers(): Promise<ApiResponse<User[]>> {
const users: User[] = []; // Your logic here
return EnhancedResponseHelper.success(users, 'Users retrieved successfully');
}

@Post()
@PowerEndpoint<User, User, { source: string }>({
auth: { roles: [DefaultRoles.ADMIN] },
audit: {
action: AuditAction.CREATE,
resource: 'User',
includeRequestBody: true,
customMetadata: (context, user) => ({ source: 'admin_panel' })
},
responseType: User
})
async createUser(@Body() userData: CreateUserDto): Promise<ApiResponse<User>> {
const newUser: User = {} as User; // Your logic here
return EnhancedResponseHelper.success(newUser, 'User created successfully');
}
}
\`\`\`

## 📋 Comprehensive Enums

Replace all hardcoded values with type-safe enums:

\`\`\`typescript
import {
DefaultRoles,
HttpStatusCodes,
ResponseStatus,
ResponseCodes,
AuditAction,
AuditLevel,
GuardLogic,
CircuitBreakerState,
RetryStrategy,
CacheStrategy,
LogLevel,
RateLimitStrategy,
ValidationStrategy,
Environment
} from '@kitstack/nest-powertools';

// Authentication & Authorization
@RequireRoles([DefaultRoles.ADMIN, DefaultRoles.MODERATOR])
async adminEndpoint() {}

// HTTP Status Codes
return EnhancedResponseHelper.custom(
true,
ResponseStatus.SUCCESS,
ResponseCodes.OPERATION_SUCCESSFUL,
data
);

// Audit Actions
@EnhancedAudit(AuditAction.PASSWORD_CHANGE, {
level: AuditLevel.HIGH,
includeRequestBody: false
})
async changePassword() {}

// Circuit Breaker States
if (circuitBreaker.getState() === CircuitBreakerState.OPEN) {
// Handle open circuit
}
\`\`\`

## ⚙️ Comprehensive Configuration

Configure every aspect of the package behavior:

\`\`\`typescript
import { PowertoolsConfigService, Environment } from '@kitstack/nest-powertools';

// Initialize configuration
const configService = PowertoolsConfigService.getInstance({
global: {
enabled: true,
environment: Environment.PRODUCTION,
debug: false,
enableMetrics: true
},

pagination: {
enabled: true,
defaultPage: 1,
defaultLimit: 20,
maxLimit: 100,
allowUnlimited: false
},

audit: {
enabled: true,
level: AuditLevel.HIGH,
includeRequestBody: true,
excludeFields: ['password', 'token', 'secret']
},

resilientHttp: {
enabled: true,
timeout: 10000,
retry: {
enabled: true,
maxAttempts: 3,
strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
exponentialBase: 2
},
circuitBreaker: {
enabled: true,
failureThreshold: 5,
resetTimeout: 60000
}
},

cache: {
enabled: true,
strategy: CacheStrategy.REDIS,
ttl: CacheTTL.MEDIUM
},

rateLimit: {
enabled: true,
strategy: RateLimitStrategy.SLIDING_WINDOW,
windowMs: 15 * 60 * 1000,
max: 100
}
});

// Update configuration at runtime
configService.updateConfig({
audit: {
level: AuditLevel.CRITICAL
}
});

// Check if features are enabled
if (configService.isFeatureEnabled('audit')) {
// Audit is enabled
}
\`\`\`

## 🎯 All Hooks as Decorators

### ✅ Composite Guards (Enhanced)
\`\`\`typescript
import { UseAndGuards, UseOrGuards, GuardLogic } from '@kitstack/nest-powertools';

// All guards must pass
@UseAndGuards(JwtAuthGuard, RolesGuard, ActiveUserGuard)
async restrictedEndpoint() {}

// At least one guard must pass
@UseOrGuards(AdminGuard, ModeratorGuard, OwnerGuard)
async flexibleEndpoint() {}

// Complex logic with configuration
@PowerEndpoint({
guards: [JwtAuthGuard, RolesGuard],
guardLogic: GuardLogic.AND
})
async complexEndpoint() {}
\`\`\`

### ✅ Enhanced Audit Logging with Generics
\`\`\`typescript
import { EnhancedAudit, AuditAction, AuditLevel } from '@kitstack/nest-powertools';

interface CustomUser {
id: string;
email: string;
department: string;
}

interface AuditMetadata {
source: string;
reason?: string;
previousValue?: any;
}

@EnhancedAudit<CustomUser, AuditMetadata>(AuditAction.UPDATE, {
resource: 'UserProfile',
level: AuditLevel.HIGH,
includeRequestBody: true,
customMetadata: (context, user) => ({
source: 'web_app',
reason: 'profile_update',
previousValue: user?.previousData
}),
condition: (context, user) => user?.department === 'finance'
})
async updateUserProfile() {}
\`\`\`

### ✅ Resilient HTTP as Decorators
\`\`\`typescript
import {
ResilientHttp,
WithRetry,
WithTimeout,
WithCircuitBreaker,
RetryStrategy
} from '@kitstack/nest-powertools';

@WithRetry(3, 1000, true)
async simpleRetry() {}

@WithTimeout(5000)
async timeoutEndpoint() {}

@ResilientHttp({
timeout: 10000,
retry: {
maxAttempts: 5,
strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
exponentialBase: 2
},
circuitBreaker: {
failureThreshold: 3,
resetTimeout: 30000
}
})
async fullyResilientEndpoint() {}
\`\`\`

## 🔥 Enhanced Response Helpers with Generics

\`\`\`typescript
import { EnhancedResponseHelper, ResponseCodes } from '@kitstack/nest-powertools';

interface UserResponse {
id: string;
email: string;
createdAt: Date;
}

// Type-safe success response
const response = EnhancedResponseHelper.success<UserResponse>(
userData,
'User created successfully',
{ source: 'api' }
);

// Type-safe paginated response
const paginatedResponse = EnhancedResponseHelper.paginated<UserResponse>(
users,
totalCount,
page,
limit
);

// Enhanced error responses
const validationError = EnhancedResponseHelper.validationError([
{ field: 'email', message: 'Invalid email format', value: 'invalid-email' }
]);

const authError = EnhancedResponseHelper.authenticationError();
const notFoundError = EnhancedResponseHelper.notFound('User');
\`\`\`

## 🚀 Ultimate Power Combinations

### PowerEndpoint - Everything in One
\`\`\`typescript
interface ApiUser {
id: string;
email: string;
roles: string[];
}

interface CreatePostDto {
title: string;
content: string;
}

interface Post {
id: string;
title: string;
content: string;
authorId: string;
createdAt: Date;
}

interface PostAuditMetadata {
contentLength: number;
tags: string[];
category: string;
}

@PowerEndpoint<ApiUser, Post, PostAuditMetadata>({
// Authentication & Authorization
auth: {
roles: [DefaultRoles.USER, DefaultRoles.ADMIN],
permissions: ['post:create']
},

// Audit Configuration
audit: {
action: AuditAction.CREATE,
resource: 'Post',
level: AuditLevel.MEDIUM,
includeRequestBody: true,
customMetadata: (context, user) => ({
contentLength: context.switchToHttp().getRequest().body?.content?.length || 0,
tags: context.switchToHttp().getRequest().body?.tags || [],
category: 'blog'
})
},

// Resilient HTTP
resilientHttp: {
timeout: 15000,
retry: {
maxAttempts: 3,
strategy: RetryStrategy.EXPONENTIAL_BACKOFF
}
},

// Caching
cache: {
strategy: CacheStrategy.REDIS,
ttl: CacheTTL.MEDIUM
},

// Rate Limiting
rateLimit: {
strategy: RateLimitStrategy.SLIDING_WINDOW,
max: 10,
windowMs: 60000
},

// API Documentation
description: 'Create a new blog post',
responseType: Post,
responses: [
{
status: HttpStatusCodes.CREATED,
description: 'Post created successfully',
type: Post
},
{
status: HttpStatusCodes.BAD_REQUEST,
description: 'Invalid input data'
}
]
})
async createPost(@Body() postData: CreatePostDto): Promise<ApiResponse<Post>> {
const newPost: Post = {} as Post; // Your logic here
return EnhancedResponseHelper.success(newPost, 'Post created successfully');
}
\`\`\`

### CRUD Endpoint with Full Generics
\`\`\`typescript
@CrudEndpoint<User, CreateUserDto, UpdateUserDto>({
entity: User,
createDto: CreateUserDto,
updateDto: UpdateUserDto,
roles: [DefaultRoles.ADMIN],
permissions: ['user:manage'],
audit: true,
cache: true,
description: 'User CRUD operations'
})
async crudOperation() {}
\`\`\`

## 📊 Hook Implementation Status

### ✅ All Hooks Work as Decorators

| Hook | Decorator Support | Generic Support | Configuration | Status |
|------|------------------|-----------------|---------------|---------|
| **Composite Guards** | ✅ `@UseAndGuards()`, `@UseOrGuards()`, `@UseNotGuard()` | ✅ Full | ✅ Complete | ✅ Ready |
| **Audit Logging** | ✅ `@EnhancedAudit()`, `@AuditCreate()`, etc. | ✅ Full | ✅ Complete | ✅ Ready |
| **Resilient HTTP** | ✅ `@ResilientHttp()`, `@WithRetry()`, etc. | ✅ Full | ✅ Complete | ✅ Ready |

### 🚫 No Limitations Found

All three hooks have been successfully implemented as decorators with:
- ✅ **Full generic support** for type safety
- ✅ **Comprehensive configuration options**
- ✅ **Enum-based values** for maintainability
- ✅ **Backward compatibility** maintained

## 🎯 Migration Guide

### From Hardcoded Values to Enums
\`\`\`typescript
// Before
@RequireRoles(['admin', 'moderator'])
return { status: 'success', code: 'OPERATION_SUCCESSFUL' };

// After
@RequireRoles  'moderator'])
return { status: 'success', code: 'OPERATION_SUCCESSFUL' };

// After
@RequireRoles([DefaultRoles.ADMIN, DefaultRoles.MODERATOR])
return EnhancedResponseHelper.success(data, 'Operation completed', {
code: ResponseCodes.OPERATION_SUCCESSFUL
});
\`\`\`

### From Basic Responses to Generic Responses
\`\`\`typescript
// Before
return { success: true, data: users };

// After
return EnhancedResponseHelper.success<User[]>(users, 'Users retrieved');
\`\`\`

### From Service Injection to Decorators
\`\`\`typescript
// Before
constructor(private resilientHttp: ResilientHttpService) {}

async apiCall() {
return this.resilientHttp.get(url, { timeout: 5000 });
}

// After
@WithTimeout(5000)
async apiCall() {
return this.resilientHttp.get(url);
}
\`\`\`

## 🔧 Configuration Examples

### Environment-Specific Configuration
\`\`\`typescript
import { Environment, PowertoolsConfigService } from '@kitstack/nest-powertools';

// Development configuration
const devConfig = {
global: {
environment: Environment.DEVELOPMENT,
debug: true,
enableMetrics: true
},
audit: {
enabled: true,
level: AuditLevel.LOW,
includeRequestBody: true
},
resilientHttp: {
retry: { maxAttempts: 1 }, // Less retries in dev
circuitBreaker: { enabled: false } // Disable circuit breaker in dev
}
};

// Production configuration
const prodConfig = {
global: {
environment: Environment.PRODUCTION,
debug: false,
enableMetrics: true
},
audit: {
enabled: true,
level: AuditLevel.HIGH,
includeRequestBody: false // Don't log request bodies in prod
},
resilientHttp: {
retry: { maxAttempts: 5 },
circuitBreaker: { enabled: true }
}
};

// Initialize based on environment
const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
PowertoolsConfigService.getInstance(config);
\`\`\`

### Feature-Specific Configuration
\`\`\`typescript
// Configure only specific features
const configService = PowertoolsConfigService.getInstance();

// Update audit configuration
configService.updateConfig({
audit: {
level: AuditLevel.CRITICAL,
excludeFields: ['password', 'ssn', 'creditCard'],
customMetadata: (context, user) => ({
sessionId: context.switchToHttp().getRequest().sessionID,
userAgent: context.switchToHttp().getRequest().headers['user-agent']
})
}
});

// Update resilient HTTP configuration
configService.updateConfig({
resilientHttp: {
timeout: 30000,
retry: {
strategy: RetryStrategy.LINEAR_BACKOFF,
maxAttempts: 10
}
}
});
\`\`\`

## 📚 Advanced Usage Examples

### Custom Generic Types
\`\`\`typescript
// Define your domain types
interface BlogPost {
id: string;
title: string;
content: string;
author: Author;
tags: string[];
publishedAt: Date;
}

interface Author {
id: string;
name: string;
email: string;
}

interface BlogAuditMetadata {
wordCount: number;
readingTime: number;
category: string;
previousTitle?: string;
}

// Use with powertools
@PowerEndpoint<Author, BlogPost, BlogAuditMetadata>({
auth: {
roles: [DefaultRoles.EDITOR, DefaultRoles.ADMIN],
customValidator: async (user, context) => {
return user.isActive && user.emailVerified;
}
},
audit: {
action: AuditAction.UPDATE,
resource: 'BlogPost',
level: AuditLevel.MEDIUM,
customMetadata: (context, user) => {
const body = context.switchToHttp().getRequest().body;
return {
wordCount: body.content?.split(' ').length || 0,
readingTime: Math.ceil((body.content?.split(' ').length || 0) / 200),
category: body.category || 'uncategorized',
previousTitle: body.previousTitle
};
}
},
responseType: BlogPost
})
async updateBlogPost(@Body() updateData: any): Promise<ApiResponse<BlogPost>> {
// Your implementation
const updatedPost: BlogPost = {} as BlogPost;
return EnhancedResponseHelper.success(updatedPost, 'Blog post updated successfully');
}
\`\`\`

### Complex Guard Combinations
\`\`\`typescript
import { GuardLogic, CompositeGuardHelper } from '@kitstack/nest-powertools';

// Create complex guard logic
const complexGuard = CompositeGuardHelper.Custom({
guards: [
CompositeGuardHelper.Or(AdminGuard, ModeratorGuard),
CompositeGuardHelper.And(ActiveUserGuard, VerifiedEmailGuard),
CompositeGuardHelper.Not(BannedUserGuard)
],
logic: GuardLogic.AND,
name: 'ComplexBusinessLogicGuard'
});

@UseGuards(complexGuard)
@EnhancedAudit(AuditAction.CUSTOM, {
resource: 'ComplexOperation',
level: AuditLevel.HIGH
})
async complexBusinessOperation() {
// Only accessible by:
// (Admin OR Moderator) AND (Active AND Verified) AND NOT Banned
}
\`\`\`

## 🎯 Best Practices

### 1. Type Safety First
\`\`\`typescript
// Always define your types
interface UserCreateRequest {
email: string;
name: string;
role: DefaultRoles;
}

interface UserResponse {
id: string;
email: string;
name: string;
role: DefaultRoles;
createdAt: Date;
}

// Use them in decorators
@PowerEndpoint<User, UserResponse>({
responseType: UserResponse
})
async createUser(@Body() data: UserCreateRequest): Promise<ApiResponse<UserResponse>> {
// Type-safe implementation
}
\`\`\`

### 2. Configuration Management
\`\`\`typescript
// Create environment-specific configurations
const createConfig = (env: Environment) => ({
global: { environment: env },
audit: {
level: env === Environment.PRODUCTION ? AuditLevel.HIGH : AuditLevel.LOW
},
resilientHttp: {
retry: {
maxAttempts: env === Environment.PRODUCTION ? 5 : 2
}
}
});
\`\`\`

### 3. Enum Usage
\`\`\`typescript
// Always use enums instead of hardcoded strings
@EnhancedAudit(AuditAction.PASSWORD_CHANGE, {
level: AuditLevel.CRITICAL,
resource: 'UserSecurity'
})
@ResilientHttp({
retry: {
strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
maxAttempts: 3
}
})
async changePassword() {}
\`\`\`

## 🚀 Performance Considerations

### Conditional Execution
\`\`\`typescript
@EnhancedAudit(AuditAction.READ, {
condition: (context, user) => {
// Only audit for admin users or sensitive operations
return user?.roles?.includes(DefaultRoles.ADMIN) ||
context.switchToHttp().getRequest().url.includes('/sensitive');
}
})
async conditionalAudit() {}
\`\`\`

### Efficient Caching
\`\`\`typescript
@PowerEndpoint({
cache: {
strategy: CacheStrategy.REDIS,
ttl: CacheTTL.LONG,
condition: (data) => data && Object.keys(data).length > 0,
key: (context) => `user_${context.switchToHttp().getRequest().user?.id}`
}
})
async efficientCaching() {}
\`\`\`

## 📈 Monitoring and Metrics

### Built-in Metrics Collection
\`\`\`typescript
// Enable metrics in configuration
const config = {
global: { enableMetrics: true },
resilientHttp: { enableMetrics: true }
};

// Access metrics
@Controller('metrics')
export class MetricsController {
constructor(private resilientHttp: ResilientHttpService) {}

@Get('circuit-breakers')
getCircuitBreakerStats() {
return this.resilientHttp.getCircuitBreakerStats();
}

@Get('http-requests')
getHttpMetrics() {
return this.resilientHttp.getMetrics(100);
}
}
\`\`\`

## 🚦 Enhanced Rate Limiting with Request Delaying

### Intelligent Rate Limiting Strategy

Instead of immediately rejecting requests when limits are exceeded, our rate limiter now implements **progressive request delaying** for a better user experience:

\`\`\`typescript
// Smart rate limiting with progressive delays
@Post('login')
@UseGuards(new RateLimitGuard({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 10, // 10 attempts per window
strategy: 'delay', // Use delay strategy (default)
delayAfter: 7, // Start delaying after 7 requests
delayMs: 1000, // Base delay: 1 second
maxDelayMs: 10000, // Maximum delay: 10 seconds
delayMultiplier: 1.5 // Progressive increase
}))
async login(@Body() credentials: LoginDto) {
return this.authService.login(credentials);
}

// Legacy rejection behavior (if needed)
@Post('strict-api')
@UseGuards(new RateLimitGuard({
windowMs: 60 * 1000,
max: 100,
strategy: 'reject', // Immediately reject when exceeded
message: 'API rate limit exceeded'
}))
async strictApi() {
return this.apiService.getData();
}
\`\`\`

### How Progressive Delaying Works

1. **Normal Operation**: Requests 1-7 process immediately
2. **Gentle Delays**: Request 8 gets 1s delay, request 9 gets 1.5s delay
3. **Progressive Increase**: Each subsequent request gets longer delays
4. **Capped Maximum**: Delays never exceed the configured maximum
5. **Jitter Applied**: Small random variance prevents thundering herd

### Rate Limiting Strategies

#### Delay Strategy (Recommended)
- **Better UX**: Users get delayed responses instead of errors
- **Graceful Degradation**: System remains responsive under load
- **Configurable**: Fine-tune delay progression for your needs
- **Anti-Abuse**: Still prevents rapid-fire attacks effectively

\`\`\`typescript
const smartRateLimit = new RateLimitGuard({
strategy: 'delay',
windowMs: 5 * 60 * 1000, // 5 minute window
max: 20, // 20 requests per window
delayAfter: 15, // Start delaying after 15 requests
delayMs: 500, // Start with 500ms delay
maxDelayMs: 8000, // Cap at 8 seconds
delayMultiplier: 2 // Double delay each time
});

// Request behavior:
// Requests 1-15: Immediate response
// Request 16: 500ms delay
// Request 17: 1000ms delay  
// Request 18: 2000ms delay
// Request 19: 4000ms delay
// Request 20+: 8000ms delay (capped)
\`\`\`

#### Reject Strategy (Legacy)
- **Immediate Rejection**: Traditional HTTP 429 responses
- **Clear Boundaries**: Hard limits with error messages
- **API Compliance**: Standard rate limiting behavior

\`\`\`typescript
const strictRateLimit = new RateLimitGuard({
strategy: 'reject',
windowMs: 15 * 60 * 1000,
max: 100,
message: 'Rate limit exceeded. Try again in 15 minutes.'
});
\`\`\`

### Rate Limit Monitoring

Get real-time rate limit status for debugging and monitoring:

\`\`\`typescript
@Get('rate-limit-status')
async getRateLimitStatus(@Req() request: Request) {
const rateLimitGuard = new RateLimitGuard();
return rateLimitGuard.getStatus(request);
}

// Response:
// {
//   requests: 8,
//   remaining: 2,
//   resetTime: 1703123456789,
//   resetIn: 45000,
//   strategy: 'delay',
//   willDelay: true
// }
\`\`\`

### Use Cases by Strategy

**Delay Strategy - Best For:**
- User-facing endpoints (login, registration, profile updates)
- APIs with human users
- Mobile applications
- Gradual degradation scenarios

**Reject Strategy - Best For:**
- Machine-to-machine APIs
- Webhook endpoints
- High-throughput data processing
- Strict compliance requirements

### Configuration Examples

\`\`\`typescript
// Gentle user authentication
const authRateLimit = new RateLimitGuard({
windowMs: 15 * 60 * 1000, // 15 minutes
max: 5, // 5 login attempts
strategy: 'delay',
delayAfter: 3, // Delay after 3 attempts
delayMs: 2000, // 2 second base delay
maxDelayMs: 30000 // 30 second maximum
});

// API endpoint protection
const apiRateLimit = new RateLimitGuard({
windowMs: 60 * 1000, // 1 minute
max: 1000, // 1000 requests per minute
strategy: 'delay',
delayAfter: 800, // Delay after 800 requests
delayMs: 100, // 100ms base delay
maxDelayMs: 2000 // 2 second maximum
});

// Strict webhook protection
const webhookRateLimit = new RateLimitGuard({
windowMs: 60 * 1000, // 1 minute
max: 100, // 100 webhooks per minute
strategy: 'reject', // Immediate rejection
message: 'Webhook rate limit exceeded'
});
\`\`\`

## Perfect Companion to @kitstack/nestjs-batteries

This package works perfectly alongside `@kitstack/nestjs-batteries` to provide a complete NestJS development toolkit:

- **Batteries**: Core functionality and database integrations
- **Powertools**: Advanced decorators, guards, and utilities with full generic support

Together, they supercharge your NestJS development experience with type safety and maintainability!

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## Support

- 📖 [Documentation](https://github.com/kitstack/nest-powertools#readme)
- 🐛 [Issues](https://github.com/kitstack/nest-powertools/issues)
- 💬 [Discussions](https://github.com/kitstack/nest-powertools/discussions)
