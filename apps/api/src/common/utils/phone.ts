/**
 * Normalises a phone number to E.164.
 * Kyrgyz local formats are accepted: 0555123456, 555123456, 996555123456.
 * Returns null when the value is not a plausible phone number.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(digits)) return null;

  let e164: string;
  if (hasPlus) {
    e164 = `+${digits}`;
  } else if (digits.length === 10 && digits.startsWith('0')) {
    e164 = `+996${digits.slice(1)}`;
  } else if (digits.length === 9) {
    e164 = `+996${digits}`;
  } else if (digits.length === 12 && digits.startsWith('996')) {
    e164 = `+${digits}`;
  } else {
    return null;
  }

  if (e164.startsWith('+996')) {
    return /^\+996\d{9}$/.test(e164) ? e164 : null;
  }
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}
