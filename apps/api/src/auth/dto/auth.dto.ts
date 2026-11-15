import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

import { LOCALES, Locale } from '../../common/utils/locale';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// bcrypt only uses the first 72 bytes of a password.
const PASSWORD_MAX = 72;
const PASSWORD_RULE = /^(?=.*\p{L})(?=.*\d).+$/u;

export class PasswordFields {
  @ApiProperty({
    minLength: 8,
    maxLength: PASSWORD_MAX,
    description: 'At least one letter and one digit',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(PASSWORD_MAX)
  @Matches(PASSWORD_RULE, { message: 'password must contain at least one letter and one digit' })
  password!: string;
}

/** The value must equal another property of the same object (password confirmation). */
function SameAs(property: string, options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'sameAs',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: { message: `${propertyName} must match ${property}`, ...options },
      validator: {
        validate: (value: unknown, args: ValidationArguments) =>
          value === (args.object as Record<string, unknown>)[args.constraints[0] as string],
      },
    });
}

export class RegisterDto extends PasswordFields {
  @ApiProperty({ description: 'The password typed again' })
  @IsString()
  @SameAs('password')
  passwordConfirm!: string;

  @ApiProperty({ description: 'The customer accepted the terms of use (must be true)' })
  @Equals(true, { message: 'terms must be accepted' })
  acceptTerms!: boolean;

  @ApiProperty()
  @Transform(toLower)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '+996555123456' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ enum: LOCALES })
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}

export class LoginDto {
  @ApiProperty()
  @Transform(toLower)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @Transform(toLower)
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto extends PasswordFields {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token!: string;
}

export class ChangePasswordDto extends PasswordFields {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(PASSWORD_MAX)
  currentPassword!: string;
}
