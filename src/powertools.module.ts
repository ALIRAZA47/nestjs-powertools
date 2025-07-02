import { DynamicModule, Global, Module } from '@nestjs/common';
import { PowertoolsConfigService } from './config/powertools.config';
import { getAuditStorageFromConfig } from './hooks/audit-logging.hook';

/**
 * PowertoolsModule
 *
 * @description Global module for configuring and providing powertools features.
 * Use PowertoolsModule.forRoot(config) in your AppModule imports to set up global config.
 *
 * @example
 * @Module({
 *   imports: [
 *     PowertoolsModule.forRoot({
 *       audit: { storage: { type: 'file', filePath: './audit-logs.json' } }
 *     })
 *   ]
 * })
 * export class AppModule {}
 */
@Global()
@Module({})
export class PowertoolsModule {
  /**
   * Configure powertools globally
   * @param config PowertoolsConfig object
   * @returns DynamicModule
   */
  static forRoot(config: any): DynamicModule {
    PowertoolsConfigService.getInstance(config);
    return {
      module: PowertoolsModule,
      global: true,
      providers: [
        {
          provide: 'AuditStorage',
          useValue: getAuditStorageFromConfig(),
        },
      ],
      exports: ['AuditStorage'],
    };
  }
}
