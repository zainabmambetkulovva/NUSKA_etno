import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it.each([
    ['0555123456', '+996555123456'],
    ['0555 12-34-56', '+996555123456'],
    ['555123456', '+996555123456'],
    ['996555123456', '+996555123456'],
    ['+996 (555) 12 34 56', '+996555123456'],
    ['+7 701 123 45 67', '+77011234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['', 'abc', '12', '+99655512345', '+9965551234567', '055512345a'])(
    'rejects %s',
    (input) => {
      expect(normalizePhone(input)).toBeNull();
    }
  );
});
