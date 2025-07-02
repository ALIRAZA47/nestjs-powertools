import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  SecureEndpoint,
  DefaultRoles,
  CompositeGuardHelper,
  EnhancedAudit,
  AuditAction,
  WithRetry,
  SortFieldValidationGuard,
  ValidationPipe,
  RateLimitGuard,
  CacheInterceptor,
} from '@kitstack/nest-powertools';

@Controller('demo')
export class ExampleController {
  // 1. Secure endpoint with role
  @Get('secure')
  @SecureEndpoint({ roles: [DefaultRoles.ADMIN] })
  getSecure() {
    return { message: 'Secure endpoint for ADMIN' };
  }

  // 2. Composite guard (AND logic)
  @Get('composite')
  @UseGuards(
    CompositeGuardHelper.And(
      () => true,
      () => true,
    ),
  )
  getComposite() {
    return { message: 'Composite guard (AND) passed' };
  }

  // 3. Audit logging
  @Get('audit')
  @EnhancedAudit(AuditAction.READ, { resource: 'Demo' })
  getAudit() {
    return { message: 'Audit log created' };
  }

  // 4. Resilient HTTP (simulated)
  @Get('resilient')
  @WithRetry(2, 100)
  getResilient() {
    // Simulate a call (in real use, inject and use ResilientHttpService)
    return { message: 'Resilient HTTP simulated' };
  }

  // 5. Sort field validation guard
  @Get('sort')
  @UseGuards(
    SortFieldValidationGuard(undefined, ['name', 'email'], 'createdAt', {
      orderByField: 'sortBy',
    }),
  )
  getSorted(@Query() query: any) {
    return { message: 'Sort field validated', sortBy: query.sortBy };
  }

  // 6. Validation pipe
  @Post('validate')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  validateBody(@Body() body: any) {
    return { message: 'Validated', body };
  }

  // 7. Rate limiting and caching
  @Get('rate-cache')
  @UseGuards(new RateLimitGuard({ max: 2, windowMs: 60000 }))
  @UseInterceptors(CacheInterceptor)
  getRateCache() {
    return { message: 'Rate limited and cached' };
  }
}
