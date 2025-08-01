/**
 * Enhanced validation pipe with comprehensive configuration options.
 *
 * @class
 * @description Provides robust request validation using class-validator and class-transformer. Supports automatic transformation, whitelist filtering, and detailed error reporting. Integrates seamlessly with DTO classes and validation decorators.
 * @example
 * // Apply globally with default settings
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_PIPE,
 *       useClass: ValidationPipe,
 *     }
 *   ]
 * })
 * export class AppModule {}
 *
 * // Apply to specific endpoints with custom options
 * @Post('users')
 * @UsePipes(new ValidationPipe({
 *   transform: true,
 *   whitelist: true,
 *   forbidNonWhitelisted: true
 * }))
 * async createUser(@Body() userData: CreateUserDto) {
 *   return this.userService.create(userData);
 * }
 *
 * // DTO example
 * export class CreateUserDto {
 *   @IsEmail()
 *   email: string;
 *   @IsString()
 *   @MinLength(8)
 *   password: string;
 *   @IsOptional()
 *   @IsString()
 *   name?: string;
 * }
 * @since 1.0.0
 */
import {
  type ArgumentMetadata,
  Injectable,
  type PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import type { ValidationOptions } from '../types';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  /**
   * Initialize validation pipe with configuration options.
   *
   * @constructor
   * @param {ValidationOptions} [options] - Validation configuration.
   * @param {boolean} [options.transform] - Enable automatic type transformation (default: true).
   * @param {boolean} [options.whitelist] - Strip properties not defined in DTO (default: true).
   * @param {boolean} [options.forbidNonWhitelisted] - Throw error for unknown properties (default: true).
   * @example
   * // Strict validation (recommended for production)
   * const strictValidation = new ValidationPipe({
   *   transform: true,
   *   whitelist: true,
   *   forbidNonWhitelisted: true
   * });
   * // Lenient validation (for development)
   * const lenientValidation = new ValidationPipe({
   *   transform: true,
   *   whitelist: false,
   *   forbidNonWhitelisted: false
   * });
   * // Transform-only (no validation)
   * const transformOnly = new ValidationPipe({
   *   transform: true,
   *   whitelist: false,
   *   forbidNonWhitelisted: false
   * });
   */
  constructor(private options: ValidationOptions = {}) {
    this.options = {
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      ...options,
    };
  }

  /**
   * Transform and validate incoming data.
   *
   * @method
   * @param {*} value - Raw input value to validate and transform.
   * @param {ArgumentMetadata} metadata - Metadata about the expected type and context.
   * @returns {Promise<any>} Promise resolving to validated and transformed data.
   * @throws {BadRequestException} When validation fails with detailed error messages.
   * @example
   * // Input transformation and validation:
   * // Raw input: { "email": "user@example.com", "age": "25", "extra": "field" }
   * // DTO class: CreateUserDto with @IsEmail() email and @IsNumber() age
   * // With whitelist: true, forbidNonWhitelisted: true
   * // Result: { email: "user@example.com", age: 25 } (extra field removed, age converted)
   * // With forbidNonWhitelisted: true and unknown fields
   * // Throws: BadRequestException with details about forbidden properties
   * // Validation error example:
   * // Input: { email: "invalid-email", password: "123" }
   * // Throws: BadRequestException with message:
   * // "Validation failed: email must be a valid email; password must be at least 8 characters"
   */
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
    });

    if (errors.length > 0) {
      const errorMessages = errors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');

      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }

    return this.options.transform ? object : value;
  }

  /**
   * Determine if a type should be validated.
   *
   * @private
   * @method
   * @param {*} metatype - The type constructor to check.
   * @returns {boolean} True if the type should be validated, false otherwise.
   * @description Checks if the metatype is a custom class that should undergo validation. Excludes primitive types and built-in JavaScript types from validation.
   * @example
   * // Types that will be validated:
   * // - Custom DTO classes (CreateUserDto, UpdateUserDto, etc.)
   * // - Custom entity classes
   * // - Any class with validation decorators
   * // Types that will NOT be validated:
   * // - String, Number, Boolean (primitive types)
   * // - Array, Object (built-in types)
   * // - undefined, null
   */
  private toValidate(metatype: unknown): boolean {
    const types: Array<new (...args: any[]) => any> = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype as new (...args: any[]) => any);
  }
}
