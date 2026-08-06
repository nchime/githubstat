import { validateAndSanitizeParams } from './validators';

describe('validateAndSanitizeParams', () => {
  test('should validate valid username', () => {
    const result = validateAndSanitizeParams({ username: 'valid-username' });
    expect(result.username).toBe('valid-username');
  });

  test('should throw on empty username', () => {
    expect(() => validateAndSanitizeParams({ username: '' })).toThrow('Username is required');
  });

  test('should throw on invalid username format', () => {
    expect(() => validateAndSanitizeParams({ username: 'invalid@username' })).toThrow(
      'Invalid username format'
    );
  });

  test('should throw on too long username', () => {
    expect(() => validateAndSanitizeParams({ username: 'a'.repeat(40) })).toThrow('Username too long');
  });

  test('should sanitize hex color', () => {
    const result = validateAndSanitizeParams({
      username: 'test',
      bg_color: '#1e1b4b',
    });
    expect(result.bg_color).toBe('1e1b4b');
  });

  test('should handle invalid hex color', () => {
    const result = validateAndSanitizeParams({
      username: 'test',
      bg_color: 'invalid',
    });
    expect(result.bg_color).toBeUndefined();
  });

  test('should default to dark theme', () => {
    const result = validateAndSanitizeParams({ username: 'test' });
    expect(result.theme).toBe('dark');
  });
});
