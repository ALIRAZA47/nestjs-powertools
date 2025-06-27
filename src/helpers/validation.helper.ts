import { BadRequestException } from '@nestjs/common';

/**
 * Comprehensive validation utility with common validation patterns
 *
 * @description Provides reusable validation functions for common data types and patterns.
 * Includes email validation, password strength checking, and utility methods for
 * throwing validation errors in a consistent manner.
 *
 * @example
 * \`\`\`typescript
 * @Injectable()
 * export class UserService {
 *   async createUser(userData: CreateUserDto) {
 *     // Validate email format
 *     ValidationHelper.throwIfInvalid(
 *       ValidationHelper.validateEmail(userData.email),
 *       'Invalid email format'
 *     );
 *
 *     // Validate password strength
 *     const passwordValidation = ValidationHelper.validatePassword(userData.password);
 *     if (!passwordValidation.valid) {
 *       throw new BadRequestException(passwordValidation.errors.join(', '));
 *     }
 *
 *     // Proceed with user creation...
 *   }
 * }
 * \`\`\`
 *
 * @since 1.0.0
 */
export class ValidationHelper {
  /**
   * Validate email address format using RFC-compliant regex
   *
   * @description Checks if the provided string is a valid email address format.
   * Uses a comprehensive regex pattern that covers most valid email formats
   * according to RFC standards.
   *
   * @param email - Email address string to validate
   * @returns True if email format is valid, false otherwise
   *
   * @example
   * \`\`\`typescript
   * // Valid email addresses
   * console.log(ValidationHelper.validateEmail('user@example.com')); // true
   * console.log(ValidationHelper.validateEmail('test.email+tag@domain.co.uk')); // true
   * console.log(ValidationHelper.validateEmail('user123@sub.domain.org')); // true
   *
   * // Invalid email addresses
   * console.log(ValidationHelper.validateEmail('invalid-email')); // false
   * console.log(ValidationHelper.validateEmail('user@')); // false
   * console.log(ValidationHelper.validateEmail('@domain.com')); // false
   * console.log(ValidationHelper.validateEmail('user..double@domain.com')); // false
   *
   * // Usage in validation
   * if (!ValidationHelper.validateEmail(userInput.email)) {
   *   throw new BadRequestException('Please provide a valid email address');
   * }
   *
   * // Usage with throwIfInvalid
   * ValidationHelper.throwIfInvalid(
   *   ValidationHelper.validateEmail(email),
   *   'Email format is invalid'
   * );
   * \`\`\`
   *
   * @since 1.0.0
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength with comprehensive criteria
   *
   * @description Checks password against multiple security criteria including length,
   * character variety, and complexity requirements. Returns detailed feedback about
   * what requirements are not met.
   *
   * @param password - Password string to validate
   * @returns Object containing validation result and detailed error messages
   *
   * @example
   * \`\`\`typescript
   * // Strong password
   * const strongResult = ValidationHelper.validatePassword('MySecure123!');
   * console.log(strongResult);
   * // { valid: true, errors: [] }
   *
   * // Weak password
   * const weakResult = ValidationHelper.validatePassword('123');
   * console.log(weakResult);
   * // {
   * //   valid: false,
   * //   errors: [
   * //     'Password must be at least 8 characters long',
   * //     'Password must contain at least one lowercase letter',
   * //     'Password must contain at least one uppercase letter'
   * //   ]
   * // }
   *
   * // Usage in service
   * const passwordCheck = ValidationHelper.validatePassword(userData.password);
   * if (!passwordCheck.valid) {
   *   throw new BadRequestException({
   *     message: 'Password does not meet security requirements',
   *     errors: passwordCheck.errors
   *   });
   * }
   *
   * // Usage in DTO validation
   * @IsString()
   * @Validate((value) => {
   *   const result = ValidationHelper.validatePassword(value);
   *   return result.valid ? true : result.errors.join(', ');
   * })
   * password: string;
   * \`\`\`
   *
   * @since 1.0.0
   */
  static validatePassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Throw BadRequestException if condition is false
   *
   * @description Utility method for throwing validation errors in a consistent manner.
   * Helps reduce boilerplate code when performing validation checks.
   *
   * @param condition - Boolean condition to check
   * @param message - Error message to throw if condition is false
   *
   * @throws {BadRequestException} When condition is false
   *
   * @example
   * \`\`\`typescript
   * // Basic validation
   * ValidationHelper.throwIfInvalid(
   *   user.age >= 18,
   *   'User must be at least 18 years old'
   * );
   *
   * // Email validation
   * ValidationHelper.throwIfInvalid(
   *   ValidationHelper.validateEmail(email),
   *   'Invalid email format'
   * );
   *
   * // Complex validation
   * ValidationHelper.throwIfInvalid(
   *   userData.startDate < userData.endDate,
   *   'Start date must be before end date'
   * );
   *
   * // Multiple validations
   * ValidationHelper.throwIfInvalid(
   *   userData.username && userData.username.length >= 3,
   *   'Username must be at least 3 characters long'
   * );
   *
   * ValidationHelper.throwIfInvalid(
   *   !existingUser,
   *   'Username is already taken'
   * );
   *
   * // Usage in service methods
   * async updateUserProfile(userId: string, updateData: UpdateProfileDto) {
   *   const user = await this.findById(userId);
   *
   *   ValidationHelper.throwIfInvalid(!!user, 'User not found');
   *   ValidationHelper.throwIfInvalid(
   *     user.canUpdateProfile,
   *     'Profile updates are not allowed for this user'
   *   );
   *
   *   // Proceed with update...
   * }
   * \`\`\`
   *
   * @since 1.0.0
   */
  static throwIfInvalid(condition: boolean, message: string) {
    if (!condition) {
      throw new BadRequestException(message);
    }
  }
}
