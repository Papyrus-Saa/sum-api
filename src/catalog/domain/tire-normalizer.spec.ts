import { BadRequestException } from '@nestjs/common';
import { TireNormalizer } from './tire-normalizer';

describe('TireNormalizer', () => {
  let normalizer: TireNormalizer;

  beforeEach(() => {
    normalizer = new TireNormalizer();
  });

  describe('normalize', () => {
    it('normalizes size with lowercase r and spaces', () => {
      expect(normalizer.normalize('205/55 r16')).toBe('205/55R16');
      expect(normalizer.normalize('205 / 55 R16')).toBe('205/55R16');
      expect(normalizer.normalize('205/55R 16')).toBe('205/55R16');
    });

    it('throws for invalid size format', () => {
      expect(() => normalizer.normalize('205/55R')).toThrow(BadRequestException);
      expect(() => normalizer.normalize('abc')).toThrow(BadRequestException);
    });

    it('throws for empty input', () => {
      expect(() => normalizer.normalize('')).toThrow(BadRequestException);
    });
  });

  describe('parseVariant', () => {
    it('parses load and speed index', () => {
      expect(normalizer.parseVariant('91V')).toEqual({
        loadIndex: 91,
        speedIndex: 'V',
      });
    });

    it('throws for invalid variant format', () => {
      expect(() => normalizer.parseVariant('V91')).toThrow(BadRequestException);
      expect(() => normalizer.parseVariant('911')).toThrow(BadRequestException);
    });

    it('returns null for empty input', () => {
      expect(normalizer.parseVariant('')).toBeNull();
      expect(normalizer.parseVariant(undefined as unknown as string)).toBeNull();
    });
  });
});
