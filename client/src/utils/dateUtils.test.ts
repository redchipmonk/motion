import { describe, it, expect } from 'vitest';
import { formatPastDateLabel } from './dateUtils';

describe('formatPastDateLabel', () => {
  it('returns null for undefined or null dates', () => {
    expect(formatPastDateLabel(undefined)).toBeNull();
    // @ts-ignore
    expect(formatPastDateLabel(null)).toBeNull();
  });

  it('returns null for invalid date strings', () => {
    expect(formatPastDateLabel('invalid-date')).toBeNull();
  });

  it('formats valid date strings correctly', () => {
    // Note: The actual output depends on the machine's locale/timezone, but we can verify the structure
    // or use a regex. For standardized testing, we might mock Intl.DateTimeFormat, but for now:
    const date = '2023-10-15T12:00:00Z';
    const formatted = formatPastDateLabel(date);
    expect(formatted).not.toBeNull();
    expect(formatted).toMatch(/Oct 15, 2023/);
  });
});
