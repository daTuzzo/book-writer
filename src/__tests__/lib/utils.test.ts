import { describe, it, expect } from 'vitest';
import { countWords, estimateTokens, generateId } from '@/lib/utils';

describe('countWords', () => {
  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('returns 0 for null/undefined', () => {
    expect(countWords(null as unknown as string)).toBe(0);
    expect(countWords(undefined as unknown as string)).toBe(0);
  });

  it('returns 0 for whitespace only', () => {
    expect(countWords('   ')).toBe(0);
    expect(countWords('\t\n')).toBe(0);
  });

  it('counts single word', () => {
    expect(countWords('hello')).toBe(1);
  });

  it('counts multiple words', () => {
    expect(countWords('hello world')).toBe(2);
    expect(countWords('one two three four')).toBe(4);
  });

  it('handles multiple spaces between words', () => {
    expect(countWords('hello    world')).toBe(2);
  });

  it('handles leading/trailing whitespace', () => {
    expect(countWords('  hello world  ')).toBe(2);
  });

  it('counts Bulgarian words', () => {
    expect(countWords('Здравей свят')).toBe(2);
  });
});

describe('estimateTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimates tokens based on character count', () => {
    // ~3.5 chars per token, so 7 chars = 2 tokens
    expect(estimateTokens('1234567')).toBe(2);
  });

  it('rounds up token count', () => {
    // 1 char = ceil(1/3.5) = 1 token
    expect(estimateTokens('a')).toBe(1);
  });

  it('handles Cyrillic text', () => {
    // 14 chars = ceil(14/3.5) = 4 tokens
    const text = 'Здравей свят!!';
    expect(estimateTokens(text)).toBe(Math.ceil(text.length / 3.5));
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('returns non-empty string', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('generates alphanumeric ids', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
