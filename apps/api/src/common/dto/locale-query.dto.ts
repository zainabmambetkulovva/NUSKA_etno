import { IsIn, IsOptional } from 'class-validator';

import { LOCALES, Locale } from '../utils/locale';

/** Allows `?locale=ru|ky` on endpoints that validate their query string. */
export class LocaleQueryDto {
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}
