import { describe, expect, it } from 'vitest';
import { optionalNumberInput } from './number-input';

describe('optionalNumberInput', () => {
  it('keeps an empty field optional', () => {
    expect(optionalNumberInput('')).toBeUndefined();
    expect(optionalNumberInput(undefined)).toBeUndefined();
  });

  it('converts an entered decimal value', () => {
    expect(optionalNumberInput('12.50')).toBe(12.5);
  });

  it('leaves invalid input as NaN for schema validation', () => {
    expect(optionalNumberInput('not-a-number')).toBeNaN();
  });
});
