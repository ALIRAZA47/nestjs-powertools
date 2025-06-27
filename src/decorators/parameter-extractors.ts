import {
  createParamDecorator,
  type ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import type {
  PaginationOptions,
  EnhancedPaginationQuery,
} from '../types/generics';
import { SortOrder, PaginationDefaults } from '../types/enums';
import { PowertoolsConfigService } from '../config/powertools.config';

/**
 * Enhanced Pagination decorator with full customization support
 *
 * @description Extracts and validates pagination parameters from HTTP request query string.
 * Supports custom parameter names, validation rules, sort fields, and error handling strategies.
 *
 * @param options - Configuration options for pagination behavior
 * @param options.defaultPage - Default page number when not specified (default: 1)
 * @param options.defaultLimit - Default number of items per page (default: 10)
 * @param options.maxLimit - Maximum allowed items per page (default: 100)
 * @param options.minLimit - Minimum allowed items per page (default: 1)
 * @param options.allowUnlimited - Whether to allow unlimited results with special values (default: false)
 * @param options.defaultSortBy - Default field to sort by (default: "id")
 * @param options.defaultSortOrder - Default sort order (default: SortOrder.ASC)
 * @param options.allowedSortFields - Array of fields that can be used for sorting (empty = all allowed)
 * @param options.allowedSortOrders - Array of allowed sort orders (default: [ASC, DESC])
 * @param options.pageParam - Query parameter name for page number (default: "page")
 * @param options.limitParam - Query parameter name for limit (default: "limit")
 * @param options.sortByParam - Query parameter name for sort field (default: "sortBy")
 * @param options.sortOrderParam - Query parameter name for sort order (default: "sortOrder")
 * @param options.searchParam - Query parameter name for search query (default: "search")
 * @param options.filtersParam - Query parameter name for filters object (default: "filters")
 * @param options.transform - Whether to transform and parse values (default: true)
 * @param options.validate - Whether to validate input parameters (default: true)
 * @param options.customValidator - Custom validation function for additional checks
 * @param options.onInvalidQuery - Behavior when validation fails: "throw" | "default" | "ignore"
 *
 * @returns {ParameterDecorator} Decorator that extracts EnhancedPaginationQuery from request
 *
 * @example
 * \`\`\`typescript
 * @Get('users')
 * @Pagination({
 *   defaultLimit: 20,
 *   maxLimit: 100,
 *   allowedSortFields: ['name', 'email', 'createdAt'],
 *   onInvalidQuery: 'default'
 * })
 * async getUsers(pagination: EnhancedPaginationQuery) {
 *   // pagination contains: { page, limit, sortBy, sortOrder, search, filters, offset, ... }
 * }
 * \`\`\`
 *
 * @example URL examples:
 * \`\`\`
 * GET /users?page=2&limit=25&sortBy=name&sortOrder=DESC&search=john&filters={"active":true}
 * GET /users?limit=unlimited  // If allowUnlimited is true
 * \`\`\`
 *
 * @throws {BadRequestException} When validation fails and onInvalidQuery is "throw"
 *
 * @since 1.0.0
 */
export const Pagination = createParamDecorator(
  (
    options: PaginationOptions = {},
    ctx: ExecutionContext,
  ): EnhancedPaginationQuery => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;
    const configService = PowertoolsConfigService.getInstance();
    const globalPaginationConfig = configService.getFeatureConfig('pagination');

    // Merge configurations: global < decorator options
    const config: Required<PaginationOptions> = {
      defaultPage:
        options.defaultPage ??
        globalPaginationConfig?.defaultPage ??
        PaginationDefaults.DEFAULT_PAGE,
      defaultLimit:
        options.defaultLimit ??
        globalPaginationConfig?.defaultLimit ??
        PaginationDefaults.DEFAULT_LIMIT,
      maxLimit:
        options.maxLimit ??
        globalPaginationConfig?.maxLimit ??
        PaginationDefaults.MAX_LIMIT,
      minLimit: options.minLimit ?? 1, // Corrected undeclared variable
      allowUnlimited:
        options.allowUnlimited ??
        globalPaginationConfig?.allowUnlimited ??
        false,
      defaultSortBy: options.defaultSortBy ?? 'id',
      defaultSortOrder:
        options.defaultSortOrder ??
        globalPaginationConfig?.sortOrder ??
        SortOrder.ASC,
      allowedSortFields: options.allowedSortFields ?? [],
      allowedSortOrders: options.allowedSortOrders ?? [
        SortOrder.ASC,
        SortOrder.DESC,
      ],
      pageParam: options.pageParam ?? 'page',
      limitParam: options.limitParam ?? 'limit',
      sortByParam: options.sortByParam ?? 'sortBy',
      sortOrderParam: options.sortOrderParam ?? 'sortOrder',
      searchParam: options.searchParam ?? 'search',
      filtersParam: options.filtersParam ?? 'filters',
      transform: options.transform ?? true,
      validate: options.validate ?? true,
      customValidator: options.customValidator,
      onInvalidQuery: options.onInvalidQuery ?? 'throw',
    };

    // Extract values from query using custom parameter names
    const rawPage = query[config.pageParam];
    const rawLimit = query[config.limitParam];
    const rawSortBy = query[config.sortByParam];
    const rawSortOrder = query[config.sortOrderParam];
    const rawSearch = query[config.searchParam];
    const rawFilters = query[config.filtersParam];

    // Parse and validate page
    let page = config.defaultPage;
    if (rawPage !== undefined) {
      const parsedPage = Number.parseInt(rawPage as string);
      if (config.validate && (isNaN(parsedPage) || parsedPage < 1)) {
        return handleInvalidQuery(
          config.onInvalidQuery,
          'Invalid page number',
          {
            page: config.defaultPage,
            limit: config.defaultLimit,
            sortBy: config.defaultSortBy,
            sortOrder: config.defaultSortOrder,
          },
        );
      }
      page = parsedPage || config.defaultPage;
    }

    // Parse and validate limit
    let limit = config.defaultLimit;
    if (rawLimit !== undefined) {
      if (rawLimit === 'unlimited' || rawLimit === '-1') {
        if (!config.allowUnlimited) {
          return handleInvalidQuery(
            config.onInvalidQuery,
            'Unlimited results not allowed',
            {
              page,
              limit: config.defaultLimit,
              sortBy: config.defaultSortBy,
              sortOrder: config.defaultSortOrder,
            },
          );
        }
        limit = -1; // Unlimited
      } else {
        const parsedLimit = Number.parseInt(rawLimit as string);
        if (
          config.validate &&
          (isNaN(parsedLimit) || parsedLimit < config.minLimit)
        ) {
          return handleInvalidQuery(
            config.onInvalidQuery,
            'Invalid limit value',
            {
              page,
              limit: config.defaultLimit,
              sortBy: config.defaultSortBy,
              sortOrder: config.defaultSortOrder,
            },
          );
        }

        // Apply max limit constraint
        if (parsedLimit > config.maxLimit && !config.allowUnlimited) {
          limit = config.maxLimit;
        } else {
          limit = parsedLimit || config.defaultLimit;
        }
      }
    }

    // Parse and validate sortBy
    let sortBy = config.defaultSortBy;
    if (rawSortBy !== undefined) {
      const requestedSortBy = rawSortBy as string;
      if (
        config.allowedSortFields.length > 0 &&
        !config.allowedSortFields.includes(requestedSortBy)
      ) {
        if (config.validate) {
          return handleInvalidQuery(
            config.onInvalidQuery,
            `Invalid sort field: ${requestedSortBy}`,
            {
              page,
              limit,
              sortBy: config.defaultSortBy,
              sortOrder: config.defaultSortOrder,
            },
          );
        }
      } else {
        sortBy = requestedSortBy;
      }
    }

    // Parse and validate sortOrder
    let sortOrder = config.defaultSortOrder;
    if (rawSortOrder !== undefined) {
      const requestedSortOrder = (
        rawSortOrder as string
      ).toUpperCase() as SortOrder;
      if (!config.allowedSortOrders.includes(requestedSortOrder)) {
        if (config.validate) {
          return handleInvalidQuery(
            config.onInvalidQuery,
            `Invalid sort order: ${rawSortOrder}`,
            {
              page,
              limit,
              sortBy,
              sortOrder: config.defaultSortOrder,
            },
          );
        }
      } else {
        sortOrder = requestedSortOrder;
      }
    }

    // Parse search
    const search = rawSearch ? String(rawSearch) : undefined;

    // Parse filters
    let filters: Record<string, any> | undefined;
    if (rawFilters) {
      try {
        if (typeof rawFilters === 'string') {
          filters = JSON.parse(rawFilters);
        } else {
          filters = rawFilters as Record<string, any>;
        }
      } catch (error) {
        if (config.validate) {
          return handleInvalidQuery(
            config.onInvalidQuery,
            'Invalid filters format',
            {
              page,
              limit,
              sortBy,
              sortOrder,
            },
          );
        }
      }
    }

    // Create pagination result
    const paginationResult: EnhancedPaginationQuery = {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      filters,
      offset: limit === -1 ? 0 : (page - 1) * limit,
      hasCustomLimits:
        limit !== config.defaultLimit || page !== config.defaultPage,
      originalQuery: { ...query },
    };

    // Apply custom validation if provided
    if (config.customValidator) {
      const validationResult = config.customValidator(paginationResult);
      if (validationResult !== true) {
        const errorMessage =
          typeof validationResult === 'string'
            ? validationResult
            : 'Custom validation failed';
        return handleInvalidQuery(config.onInvalidQuery, errorMessage, {
          page: config.defaultPage,
          limit: config.defaultLimit,
          sortBy: config.defaultSortBy,
          sortOrder: config.defaultSortOrder,
        });
      }
    }

    return paginationResult;

    function handleInvalidQuery(
      onInvalidQuery: 'throw' | 'default' | 'ignore',
      message: string,
      defaultValues: Partial<EnhancedPaginationQuery>,
    ): EnhancedPaginationQuery {
      switch (onInvalidQuery) {
        case 'throw':
          throw new BadRequestException(message);
        case 'default':
          return {
            ...defaultValues,
            offset:
              ((defaultValues.page || 1) - 1) * (defaultValues.limit || 10),
            hasCustomLimits: false,
            originalQuery: { ...query },
          } as EnhancedPaginationQuery;
        case 'ignore':
        default:
          return paginationResult;
      }
    }
  },
);

/**
 * Quick pagination decorator with common presets for different use cases
 *
 * @description Provides pre-configured pagination decorators for common scenarios
 * without needing to specify all options manually.
 *
 * @since 1.0.0
 */
export const QuickPagination = {
  /**
   * Small pagination preset for lightweight lists
   *
   * @description Configured for small datasets with conservative limits.
   * Default: 5 items per page, max 20 items per page.
   *
   * @param options - Additional options to override defaults
   * @returns {ParameterDecorator} Pagination decorator with small preset
   *
   * @example
   * \`\`\`typescript
   * @Get('recent-notifications')
   * @QuickPagination.Small()
   * async getRecentNotifications(pagination: EnhancedPaginationQuery) {
   *   // Will have: defaultLimit: 5, maxLimit: 20
   * }
   * \`\`\`
   */
  Small: (options: Partial<PaginationOptions> = {}) =>
    Pagination({
      defaultLimit: 5,
      maxLimit: 20,
      ...options,
    }),

  /**
   * Medium pagination preset for standard lists
   *
   * @description Balanced configuration for typical API endpoints.
   * Default: 10 items per page, max 50 items per page.
   *
   * @param options - Additional options to override defaults
   * @returns {ParameterDecorator} Pagination decorator with medium preset
   *
   * @example
   * \`\`\`typescript
   * @Get('posts')
   * @QuickPagination.Medium({ allowedSortFields: ['title', 'createdAt'] })
   * async getPosts(pagination: EnhancedPaginationQuery) {
   *   // Will have: defaultLimit: 10, maxLimit: 50, plus custom sort fields
   * }
   * \`\`\`
   */
  Medium: (options: Partial<PaginationOptions> = {}) =>
    Pagination({
      defaultLimit: 10,
      maxLimit: 50,
      ...options,
    }),

  /**
   * Large pagination preset for data-heavy endpoints
   *
   * @description Configured for endpoints that may need to return larger datasets.
   * Default: 25 items per page, max 200 items per page.
   *
   * @param options - Additional options to override defaults
   * @returns {ParameterDecorator} Pagination decorator with large preset
   *
   * @example
   * \`\`\`typescript
   * @Get('analytics-data')
   * @QuickPagination.Large()
   * async getAnalyticsData(pagination: EnhancedPaginationQuery) {
   *   // Will have: defaultLimit: 25, maxLimit: 200
   * }
   * \`\`\`
   */
  Large: (options: Partial<PaginationOptions> = {}) =>
    Pagination({
      defaultLimit: 25,
      maxLimit: 200,
      ...options,
    }),

  /**
   * Unlimited pagination preset for admin or export endpoints
   *
   * @description Allows unlimited results for administrative purposes or data exports.
   * Supports special values like "unlimited" or "-1" for the limit parameter.
   *
   * @param options - Additional options to override defaults
   * @returns {ParameterDecorator} Pagination decorator with unlimited preset
   *
   * @example
   * \`\`\`typescript
   * @Get('export-users')
   * @QuickPagination.Unlimited()
   * async exportUsers(pagination: EnhancedPaginationQuery) {
   *   // Supports: ?limit=unlimited or ?limit=-1
   *   if (pagination.limit === -1) {
   *     // Return all results
   *   }
   * }
   * \`\`\`
   */
  Unlimited: (options: Partial<PaginationOptions> = {}) =>
    Pagination({
      defaultLimit: 10,
      maxLimit: 1000,
      allowUnlimited: true,
      ...options,
    }),

  /**
   * Search-focused pagination preset for search endpoints
   *
   * @description Optimized for search functionality with custom search parameter name.
   * Uses "q" as the search parameter name by convention.
   *
   * @param options - Additional options to override defaults
   * @returns {ParameterDecorator} Pagination decorator with search preset
   *
   * @example
   * \`\`\`typescript
   * @Get('search')
   * @QuickPagination.Search()
   * async searchUsers(pagination: EnhancedPaginationQuery) {
   *   // URL: /search?q=john&page=1&limit=20
   *   const searchTerm = pagination.search; // "john"
   * }
   * \`\`\`
   */
  Search: (options: Partial<PaginationOptions> = {}) =>
    Pagination({
      defaultLimit: 20,
      maxLimit: 100,
      searchParam: 'q',
      ...options,
    }),

  /**
   * Strict pagination preset with validation enforcement
   *
   * @description Enforces strict validation and throws errors on invalid input.
   * Recommended for public APIs where input validation is critical.
   *
   * @param options - Additional options to override defaults
   * @returns {ParameterDecorator} Pagination decorator with strict validation
   *
   * @throws {BadRequestException} On any validation failure
   *
   * @example
   * \`\`\`typescript
   * @Get('public-api/users')
   * @QuickPagination.Strict()
   * async getPublicUsers(pagination: EnhancedPaginationQuery) {
   *   // Will throw BadRequestException for invalid page/limit values
   * }
   * \`\`\`
   */
  Strict: (options: Partial<PaginationOptions> = {}) =>
    Pagination({
      defaultLimit: 10,
      maxLimit: 100,
      validate: true,
      onInvalidQuery: 'throw',
      ...options,
    }),

  /**
   * Lenient pagination preset with graceful error handling
   *
   * @description Uses default values when invalid input is provided instead of throwing errors.
   * Recommended for internal APIs or when user experience is prioritized over strict validation.
   *
   * @param options - Additional options to override defaults
   * @returns {ParameterDecorator} Pagination decorator with lenient validation
   *
   * @example
   * \`\`\`typescript
   * @Get('dashboard/users')
   * @QuickPagination.Lenient()
   * async getDashboardUsers(pagination: EnhancedPaginationQuery) {
   *   // Invalid inputs will be replaced with defaults instead of throwing errors
   * }
   * \`\`\`
   */
  Lenient: (options: Partial<PaginationOptions> = {}) =>
    Pagination({
      defaultLimit: 10,
      maxLimit: 100,
      validate: true,
      onInvalidQuery: 'default',
      ...options,
    }),
};

/**
 * Advanced pagination decorator builder using the Builder pattern
 *
 * @description Provides a fluent interface for building complex pagination configurations.
 * Allows method chaining to create highly customized pagination behavior.
 *
 * @example
 * \`\`\`typescript
 * const customPagination = createPagination()
 *   .defaultLimit(15)
 *   .maxLimit(100)
 *   .allowedSortFields(['name', 'email', 'createdAt'])
 *   .paramNames({ page: 'pageNum', limit: 'pageSize' })
 *   .customValidator((query) => {
 *     if (query.limit > 50 && !query.search) {
 *       return "Large limits require a search query";
 *     }
 *     return true;
 *   })
 *   .build();
 *
 * @Get('custom-users')
 * @customPagination
 * async getCustomUsers(pagination: EnhancedPaginationQuery) {
 *   // Uses the custom configuration built above
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export class PaginationBuilder {
  private options: PaginationOptions = {};

  /**
   * Set the default page number when not specified in query
   *
   * @param page - Default page number (must be >= 1)
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().defaultPage(1) // Start from page 1
   * \`\`\`
   */
  defaultPage(page: number): PaginationBuilder {
    this.options.defaultPage = page;
    return this;
  }

  /**
   * Set the default number of items per page
   *
   * @param limit - Default items per page (must be >= 1)
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().defaultLimit(20) // 20 items per page by default
   * \`\`\`
   */
  defaultLimit(limit: number): PaginationBuilder {
    this.options.defaultLimit = limit;
    return this;
  }

  /**
   * Set the maximum allowed items per page
   *
   * @param limit - Maximum items per page (must be >= minLimit)
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().maxLimit(100) // Never allow more than 100 items
   * \`\`\`
   */
  maxLimit(limit: number): PaginationBuilder {
    this.options.maxLimit = limit;
    return this;
  }

  /**
   * Set the minimum allowed items per page
   *
   * @param limit - Minimum items per page (must be >= 1)
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().minLimit(5) // Require at least 5 items per page
   * \`\`\`
   */
  minLimit(limit: number): PaginationBuilder {
    this.options.minLimit = limit;
    return this;
  }

  /**
   * Enable or disable unlimited results
   *
   * @param allow - Whether to allow unlimited results (default: true)
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().allowUnlimited(true) // Allow ?limit=unlimited
   * \`\`\`
   */
  allowUnlimited(allow = true): PaginationBuilder {
    this.options.allowUnlimited = allow;
    return this;
  }

  /**
   * Set the default field to sort by
   *
   * @param field - Default sort field name
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().defaultSortBy('createdAt') // Sort by creation date by default
   * \`\`\`
   */
  defaultSortBy(field: string): PaginationBuilder {
    this.options.defaultSortBy = field;
    return this;
  }

  /**
   * Set the default sort order
   *
   * @param order - Default sort order (ASC or DESC)
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().defaultSortOrder(SortOrder.DESC) // Newest first by default
   * \`\`\`
   */
  defaultSortOrder(order: SortOrder): PaginationBuilder {
    this.options.defaultSortOrder = order;
    return this;
  }

  /**
   * Restrict which fields can be used for sorting
   *
   * @param fields - Array of allowed sort field names
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().allowedSortFields(['name', 'email', 'createdAt'])
   * // Only these fields can be used in ?sortBy=fieldName
   * \`\`\`
   */
  allowedSortFields(fields: string[]): PaginationBuilder {
    this.options.allowedSortFields = fields;
    return this;
  }

  /**
   * Restrict which sort orders are allowed
   *
   * @param orders - Array of allowed sort orders
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().allowedSortOrders([SortOrder.ASC])
   * // Only ascending sort allowed
   * \`\`\`
   */
  allowedSortOrders(orders: SortOrder[]): PaginationBuilder {
    this.options.allowedSortOrders = orders;
    return this;
  }

  /**
   * Customize the query parameter names used in URLs
   *
   * @param params - Object mapping parameter types to custom names
   * @param params.page - Custom name for page parameter (default: "page")
   * @param params.limit - Custom name for limit parameter (default: "limit")
   * @param params.sortBy - Custom name for sortBy parameter (default: "sortBy")
   * @param params.sortOrder - Custom name for sortOrder parameter (default: "sortOrder")
   * @param params.search - Custom name for search parameter (default: "search")
   * @param params.filters - Custom name for filters parameter (default: "filters")
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().paramNames({
   *   page: 'pageNum',
   *   limit: 'pageSize',
   *   sortBy: 'orderBy'
   * })
   * // URL becomes: ?pageNum=2&pageSize=20&orderBy=name
   * \`\`\`
   */
  paramNames(params: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    filters?: string;
  }): PaginationBuilder {
    if (params.page) this.options.pageParam = params.page;
    if (params.limit) this.options.limitParam = params.limit;
    if (params.sortBy) this.options.sortByParam = params.sortBy;
    if (params.sortOrder) this.options.sortOrderParam = params.sortOrder;
    if (params.search) this.options.searchParam = params.search;
    if (params.filters) this.options.filtersParam = params.filters;
    return this;
  }

  /**
   * Enable or disable input validation
   *
   * @param enable - Whether to validate input parameters (default: true)
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().validate(false) // Skip validation for performance
   * \`\`\`
   */
  validate(enable = true): PaginationBuilder {
    this.options.validate = enable;
    return this;
  }

  /**
   * Set behavior when validation fails
   *
   * @param behavior - How to handle invalid input
   *   - "throw": Throw BadRequestException
   *   - "default": Use default values
   *   - "ignore": Continue with invalid values
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().onInvalidQuery('default')
   * // Use defaults instead of throwing errors
   * \`\`\`
   */
  onInvalidQuery(behavior: 'throw' | 'default' | 'ignore'): PaginationBuilder {
    this.options.onInvalidQuery = behavior;
    return this;
  }

  /**
   * Add custom validation logic
   *
   * @param validator - Function that validates the pagination query
   *   - Return true if valid
   *   - Return string with error message if invalid
   *   - Return false for generic validation failure
   * @returns {PaginationBuilder} Builder instance for method chaining
   *
   * @example
   * \`\`\`typescript
   * createPagination().customValidator((query) => {
   *   if (query.limit > 100 && !query.search) {
   *     return "Large page sizes require a search term";
   *   }
   *   if (query.page > 1000) {
   *     return "Page number too high";
   *   }
   *   return true;
   * })
   * \`\`\`
   */
  customValidator(
    validator: (query: any) => boolean | string,
  ): PaginationBuilder {
    this.options.customValidator = validator;
    return this;
  }

  /**
   * Build the final pagination decorator
   *
   * @returns {ParameterDecorator} The configured pagination decorator
   *
   * @example
   * \`\`\`typescript
   * const myPagination = createPagination()
   *   .defaultLimit(25)
   *   .maxLimit(100)
   *   .build();
   *
   * @Get('items')
   * @myPagination
   * async getItems(pagination: EnhancedPaginationQuery) {
   *   // Use the configured pagination
   * }
   * \`\`\`
   */
  build(): ParameterDecorator {
    // Create a copy of the current options to avoid mutation
    const builderOptions = { ...this.options };

    // Return a new parameter decorator that uses the builder's options
    return createParamDecorator(
      (data: unknown, ctx: ExecutionContext): EnhancedPaginationQuery => {
        const request = ctx.switchToHttp().getRequest();
        const query = request.query;
        const configService = PowertoolsConfigService.getInstance();
        const globalPaginationConfig =
          configService.getFeatureConfig('pagination');

        // Merge configurations: global < decorator options
        const config: Required<PaginationOptions> = {
          defaultPage:
            builderOptions.defaultPage ??
            globalPaginationConfig?.defaultPage ??
            PaginationDefaults.DEFAULT_PAGE,
          defaultLimit:
            builderOptions.defaultLimit ??
            globalPaginationConfig?.defaultLimit ??
            PaginationDefaults.DEFAULT_LIMIT,
          maxLimit:
            builderOptions.maxLimit ??
            globalPaginationConfig?.maxLimit ??
            PaginationDefaults.MAX_LIMIT,
          minLimit: builderOptions.minLimit ?? 1,
          allowUnlimited:
            builderOptions.allowUnlimited ??
            globalPaginationConfig?.allowUnlimited ??
            false,
          defaultSortBy: builderOptions.defaultSortBy ?? 'id',
          defaultSortOrder:
            builderOptions.defaultSortOrder ??
            globalPaginationConfig?.sortOrder ??
            SortOrder.ASC,
          allowedSortFields: builderOptions.allowedSortFields ?? [],
          allowedSortOrders: builderOptions.allowedSortOrders ?? [
            SortOrder.ASC,
            SortOrder.DESC,
          ],
          pageParam: builderOptions.pageParam ?? 'page',
          limitParam: builderOptions.limitParam ?? 'limit',
          sortByParam: builderOptions.sortByParam ?? 'sortBy',
          sortOrderParam: builderOptions.sortOrderParam ?? 'sortOrder',
          searchParam: builderOptions.searchParam ?? 'search',
          filtersParam: builderOptions.filtersParam ?? 'filters',
          transform: builderOptions.transform ?? true,
          validate: builderOptions.validate ?? true,
          customValidator: builderOptions.customValidator,
          onInvalidQuery: builderOptions.onInvalidQuery ?? 'throw',
        };

        // Extract values from query using custom parameter names
        const rawPage = query[config.pageParam];
        const rawLimit = query[config.limitParam];
        const rawSortBy = query[config.sortByParam];
        const rawSortOrder = query[config.sortOrderParam];
        const rawSearch = query[config.searchParam];
        const rawFilters = query[config.filtersParam];

        // Parse and validate page
        let page = config.defaultPage;
        if (rawPage !== undefined) {
          const parsedPage = Number.parseInt(rawPage as string);
          if (config.validate && (isNaN(parsedPage) || parsedPage < 1)) {
            return handleInvalidQuery(
              config.onInvalidQuery,
              'Invalid page number',
              {
                page: config.defaultPage,
                limit: config.defaultLimit,
                sortBy: config.defaultSortBy,
                sortOrder: config.defaultSortOrder,
              },
            );
          }
          page = parsedPage || config.defaultPage;
        }

        // Parse and validate limit
        let limit = config.defaultLimit;
        if (rawLimit !== undefined) {
          if (rawLimit === 'unlimited' || rawLimit === '-1') {
            if (!config.allowUnlimited) {
              return handleInvalidQuery(
                config.onInvalidQuery,
                'Unlimited results not allowed',
                {
                  page,
                  limit: config.defaultLimit,
                  sortBy: config.defaultSortBy,
                  sortOrder: config.defaultSortOrder,
                },
              );
            }
            limit = -1; // Unlimited
          } else {
            const parsedLimit = Number.parseInt(rawLimit as string);
            if (
              config.validate &&
              (isNaN(parsedLimit) || parsedLimit < config.minLimit)
            ) {
              return handleInvalidQuery(
                config.onInvalidQuery,
                'Invalid limit value',
                {
                  page,
                  limit: config.defaultLimit,
                  sortBy: config.defaultSortBy,
                  sortOrder: config.defaultSortOrder,
                },
              );
            }

            // Apply max limit constraint
            if (parsedLimit > config.maxLimit && !config.allowUnlimited) {
              limit = config.maxLimit;
            } else {
              limit = parsedLimit || config.defaultLimit;
            }
          }
        }

        // Parse and validate sortBy
        let sortBy = config.defaultSortBy;
        if (rawSortBy !== undefined) {
          const requestedSortBy = rawSortBy as string;
          if (
            config.allowedSortFields.length > 0 &&
            !config.allowedSortFields.includes(requestedSortBy)
          ) {
            if (config.validate) {
              return handleInvalidQuery(
                config.onInvalidQuery,
                `Invalid sort field: ${requestedSortBy}`,
                {
                  page,
                  limit,
                  sortBy: config.defaultSortBy,
                  sortOrder: config.defaultSortOrder,
                },
              );
            }
          } else {
            sortBy = requestedSortBy;
          }
        }

        // Parse and validate sortOrder
        let sortOrder = config.defaultSortOrder;
        if (rawSortOrder !== undefined) {
          const requestedSortOrder = (
            rawSortOrder as string
          ).toUpperCase() as SortOrder;
          if (!config.allowedSortOrders.includes(requestedSortOrder)) {
            if (config.validate) {
              return handleInvalidQuery(
                config.onInvalidQuery,
                `Invalid sort order: ${rawSortOrder}`,
                {
                  page,
                  limit,
                  sortBy,
                  sortOrder: config.defaultSortOrder,
                },
              );
            }
          } else {
            sortOrder = requestedSortOrder;
          }
        }

        // Parse search
        const search = rawSearch ? String(rawSearch) : undefined;

        // Parse filters
        let filters: Record<string, any> | undefined;
        if (rawFilters) {
          try {
            if (typeof rawFilters === 'string') {
              filters = JSON.parse(rawFilters);
            } else {
              filters = rawFilters as Record<string, any>;
            }
          } catch (error) {
            if (config.validate) {
              return handleInvalidQuery(
                config.onInvalidQuery,
                'Invalid filters format',
                {
                  page,
                  limit,
                  sortBy,
                  sortOrder,
                },
              );
            }
          }
        }

        // Create pagination result
        const paginationResult: EnhancedPaginationQuery = {
          page,
          limit,
          sortBy,
          sortOrder,
          search,
          filters,
          offset: limit === -1 ? 0 : (page - 1) * limit,
          hasCustomLimits:
            limit !== config.defaultLimit || page !== config.defaultPage,
          originalQuery: { ...query },
        };

        // Apply custom validation if provided
        if (config.customValidator) {
          const validationResult = config.customValidator(paginationResult);
          if (validationResult !== true) {
            const errorMessage =
              typeof validationResult === 'string'
                ? validationResult
                : 'Custom validation failed';
            return handleInvalidQuery(config.onInvalidQuery, errorMessage, {
              page: config.defaultPage,
              limit: config.defaultLimit,
              sortBy: config.defaultSortBy,
              sortOrder: config.defaultSortOrder,
            });
          }
        }

        return paginationResult;

        function handleInvalidQuery(
          onInvalidQuery: 'throw' | 'default' | 'ignore',
          message: string,
          defaultValues: Partial<EnhancedPaginationQuery>,
        ): EnhancedPaginationQuery {
          switch (onInvalidQuery) {
            case 'throw':
              throw new BadRequestException(message);
            case 'default':
              return {
                ...defaultValues,
                offset:
                  ((defaultValues.page || 1) - 1) * (defaultValues.limit || 10),
                hasCustomLimits: false,
                originalQuery: { ...query },
              } as EnhancedPaginationQuery;
            case 'ignore':
            default:
              return paginationResult;
          }
        }
      },
    )();
  }

  /**
   * Get the current configuration options (useful for testing or inspection)
   *
   * @returns {PaginationOptions} Copy of the current configuration
   *
   * @example
   * \`\`\`typescript
   * const builder = createPagination().defaultLimit(25);
   * const options = builder.getOptions();
   * console.log(options.defaultLimit); // 25
   * \`\`\`
   */
  getOptions(): PaginationOptions {
    return { ...this.options };
  }
}

/**
 * Create a new pagination builder instance
 *
 * @description Factory function to create a new PaginationBuilder for fluent configuration.
 *
 * @returns {PaginationBuilder} New builder instance
 *
 * @example
 * \`\`\`typescript
 * const customPagination = createPagination()
 *   .defaultLimit(20)
 *   .allowedSortFields(['name', 'date'])
 *   .build();
 * \`\`\`
 *
 * @since 1.0.0
 */
export const createPagination = (): PaginationBuilder =>
  new PaginationBuilder();

/**
 * Domain-specific pagination decorators for common use cases
 *
 * @description Pre-built pagination configurations optimized for specific domain entities.
 * These provide sensible defaults for common data types and usage patterns.
 *
 * @since 1.0.0
 */
export const DomainPagination = {
  /**
   * User listing pagination optimized for user management interfaces
   *
   * @description Configured for typical user listing scenarios with common sort fields
   * and reasonable page sizes for user interfaces.
   *
   * Configuration:
   * - Default: 20 users per page
   * - Maximum: 100 users per page
   * - Sort fields: id, email, name, createdAt, lastLogin
   * - Default sort: createdAt DESC (newest first)
   *
   * @example
   * \`\`\`typescript
   * @Get('users')
   * @DomainPagination.Users
   * async getUsers(pagination: EnhancedPaginationQuery) {
   *   // Optimized for user listings
   * }
   * \`\`\`
   */
  Users: createPagination()
    .defaultLimit(20)
    .maxLimit(100)
    .allowedSortFields(['id', 'email', 'name', 'createdAt', 'lastLogin'])
    .defaultSortBy('createdAt')
    .defaultSortOrder(SortOrder.DESC)
    .build(),

  /**
   * Product catalog pagination optimized for e-commerce interfaces
   *
   * @description Configured for product browsing with grid layouts and product-specific sorting.
   *
   * Configuration:
   * - Default: 12 products per page (good for grid layouts)
   * - Maximum: 48 products per page
   * - Sort fields: id, name, price, category, rating, createdAt
   * - Default sort: name ASC (alphabetical)
   * - Custom parameter names: sort/order instead of sortBy/sortOrder
   *
   * @example
   * \`\`\`typescript
   * @Get('products')
   * @DomainPagination.Products
   * async getProducts(pagination: EnhancedPaginationQuery) {
   *   // URL: /products?page=1&limit=12&sort=price&order=ASC
   * }
   * \`\`\`
   */
  Products: createPagination()
    .defaultLimit(12)
    .maxLimit(48)
    .allowedSortFields([
      'id',
      'name',
      'price',
      'category',
      'rating',
      'createdAt',
    ])
    .defaultSortBy('name')
    .paramNames({ sortBy: 'sort', sortOrder: 'order' })
    .build(),

  /**
   * Blog posts pagination optimized for content management
   *
   * @description Configured for blog/article listings with content-specific sorting options.
   *
   * Configuration:
   * - Default: 10 posts per page
   * - Maximum: 50 posts per page
   * - Sort fields: id, title, publishedAt, views, likes
   * - Default sort: publishedAt DESC (newest first)
   *
   * @example
   * \`\`\`typescript
   * @Get('posts')
   * @DomainPagination.Posts
   * async getPosts(pagination: EnhancedPaginationQuery) {
   *   // Optimized for blog post listings
   * }
   * \`\`\`
   */
  Posts: createPagination()
    .defaultLimit(10)
    .maxLimit(50)
    .allowedSortFields(['id', 'title', 'publishedAt', 'views', 'likes'])
    .defaultSortBy('publishedAt')
    .defaultSortOrder(SortOrder.DESC)
    .build(),

  /**
   * Comments pagination optimized for discussion threads
   *
   * @description Configured for comment listings with chronological ordering.
   *
   * Configuration:
   * - Default: 25 comments per page
   * - Maximum: 100 comments per page
   * - Sort fields: id, createdAt, likes
   * - Default sort: createdAt ASC (chronological order)
   *
   * @example
   * \`\`\`typescript
   * @Get('posts/:id/comments')
   * @DomainPagination.Comments
   * async getComments(pagination: EnhancedPaginationQuery) {
   *   // Optimized for comment threads
   * }
   * \`\`\`
   */
  Comments: createPagination()
    .defaultLimit(25)
    .maxLimit(100)
    .allowedSortFields(['id', 'createdAt', 'likes'])
    .defaultSortBy('createdAt')
    .defaultSortOrder(SortOrder.ASC)
    .build(),

  /**
   * Admin dashboard pagination for administrative interfaces
   *
   * @description Configured for admin panels with higher limits and unlimited support.
   *
   * Configuration:
   * - Default: 50 items per page
   * - Maximum: 500 items per page
   * - Unlimited results: enabled
   * - Strict validation: enabled (throws on invalid input)
   *
   * @example
   * \`\`\`typescript
   * @Get('admin/audit-logs')
   * @DomainPagination.Admin
   * async getAuditLogs(pagination: EnhancedPaginationQuery) {
   *   // Supports: ?limit=unlimited for exports
   * }
   * \`\`\`
   */
  Admin: createPagination()
    .defaultLimit(50)
    .maxLimit(500)
    .allowUnlimited(true)
    .validate(true)
    .onInvalidQuery('throw')
    .build(),

  /**
   * Mobile app pagination optimized for mobile interfaces
   *
   * @description Configured for mobile apps with smaller page sizes and graceful error handling.
   *
   * Configuration:
   * - Default: 10 items per page (mobile-friendly)
   * - Maximum: 25 items per page (performance consideration)
   * - Lenient validation: uses defaults on invalid input
   *
   * @example
   * \`\`\`typescript
   * @Get('mobile/feed')
   * @DomainPagination.Mobile
   * async getMobileFeed(pagination: EnhancedPaginationQuery) {
   *   // Optimized for mobile performance
   * }
   * \`\`\`
   */
  Mobile: createPagination()
    .defaultLimit(10)
    .maxLimit(25)
    .validate(true)
    .onInvalidQuery('default')
    .build(),

  /**
   * Search results pagination optimized for search functionality
   *
   * @description Configured for search endpoints with search-specific validation.
   *
   * Configuration:
   * - Default: 20 results per page
   * - Maximum: 100 results per page
   * - Custom parameter names: q for search, f for filters
   * - Custom validation: requires search terms of at least 2 characters
   *
   * @example
   * \`\`\`typescript
   * @Get('search')
   * @DomainPagination.Search
   * async searchContent(pagination: EnhancedPaginationQuery) {
   *   // URL: /search?q=javascript&f={"category":"tutorial"}&page=1
   *   const searchTerm = pagination.search; // "javascript"
   *   const filters = pagination.filters; // { category: "tutorial" }
   * }
   * \`\`\`
   */
  Search: createPagination()
    .defaultLimit(20)
    .maxLimit(100)
    .paramNames({ search: 'q', filters: 'f' })
    .customValidator((query) => {
      if (query.search && query.search.length < 2) {
        return 'Search query must be at least 2 characters';
      }
      return true;
    })
    .build(),
};

/**
 * Extract the current authenticated user from the request
 *
 * @description Parameter decorator that extracts user information from the request object.
 * Assumes that authentication middleware has already populated request.user.
 *
 * @param data - Optional property name to extract from user object
 * @returns The complete user object or specific property if data is provided
 *
 * @example
 * \`\`\`typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {
 *   // user contains the full authenticated user object
 *   return user;
 * }
 *
 * @Get('user-id')
 * async getUserId(@CurrentUser('id') userId: string) {
 *   // userId contains just the id property from user
 *   return { userId };
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

/**
 * Extract the client IP address from the request
 *
 * @description Parameter decorator that extracts the client's IP address from various
 * request headers and connection properties. Handles proxy scenarios and fallbacks.
 *
 * @returns {string} The client's IP address
 *
 * @example
 * \`\`\`typescript
 * @Post('login')
 * async login(
 *   @Body() credentials: LoginDto,
 *   @IpAddress() clientIp: string
 * ) {
 *   // Log login attempt with IP for security
 *   this.auditService.logLogin(credentials.email, clientIp);
 *   return this.authService.login(credentials);
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.ip ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress
    );
  },
);

/**
 * Extract the User-Agent header from the request
 *
 * @description Parameter decorator that extracts the User-Agent string from request headers.
 * Useful for analytics, security logging, and device-specific behavior.
 *
 * @returns {string} The User-Agent string or empty string if not present
 *
 * @example
 * \`\`\`typescript
 * @Post('analytics/page-view')
 * async trackPageView(
 *   @Body() pageData: PageViewDto,
 *   @UserAgent() userAgent: string,
 *   @IpAddress() ipAddress: string
 * ) {
 *   // Track page view with device information
 *   return this.analyticsService.track({
 *     ...pageData,
 *     userAgent,
 *     ipAddress,
 *     timestamp: new Date()
 *   });
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'] || '';
  },
);
