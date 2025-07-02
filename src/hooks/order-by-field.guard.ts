import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  mixin,
} from '@nestjs/common';
import { Request } from 'express';
import { getMetadataArgsStorage } from 'typeorm';

/**
 * Guard to validate sort/order fields for list endpoints.
 *
 * @param entity - The entity class to extract valid fields from (optional, for ORM integration)
 * @param allowedFields - Additional allowed fields for sorting
 * @param defaultField - Default field to use if none provided
 * @param options - Optional: { orderByField, orderDirField } to customize query/payload field names
 *
 * @example
 * @UseGuards(SortFieldValidationGuard(User, ['email', 'name'], 'createdAt', { orderByField: 'sortBy' }))
 * @Get('users')
 * async getUsers(@Query() query: any) { ... }
 */
export function SortFieldValidationGuard(
  entity?: any,
  allowedFields: string[] = [],
  defaultField: string = 'createdAt',
  options?: { orderByField?: string; orderDirField?: string },
) {
  const orderByField = options?.orderByField || 'orderBy';
  const orderDirField = options?.orderDirField || 'orderDir';
  const baseAllowed = [
    ...allowedFields,
    'id',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  class SortFieldValidationGuardClass implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();
      const orderBy = (req.query[orderByField] ||
        req.body?.[orderByField]) as string;
      const validFields = [...baseAllowed];

      // If entity is provided and has columns (TypeORM or similar)
      if (entity && typeof entity === 'function') {
        try {
          const entCols = getMetadataArgsStorage().columns.filter(
            (col: any) => col.target === entity,
          );
          validFields.push(...entCols.map((col: any) => col.propertyName));
        } catch {
          // Not using TypeORM, skip
        }
      }

      if (orderBy) {
        if (!validFields.includes(orderBy)) {
          throw new BadRequestException(
            `Invalid ${orderByField} field. Allowed fields: ${validFields.join(', ')}`,
          );
        }
      } else {
        // Set default if not present
        if (req.query) req.query[orderByField] = defaultField;
        if (req.body && typeof req.body === 'object')
          req.body[orderByField] = defaultField;
      }
      // Optionally validate orderDir
      const orderDir = (req.query[orderDirField] ||
        req.body?.[orderDirField]) as string;
      if (
        orderDir &&
        !['ASC', 'DESC', 'asc', 'desc', 1, -1].includes(orderDir)
      ) {
        throw new BadRequestException(
          `Invalid ${orderDirField} value. Allowed: ASC, DESC, asc, desc, 1, -1`,
        );
      }
      return true;
    }
  }

  return mixin(SortFieldValidationGuardClass);
}
