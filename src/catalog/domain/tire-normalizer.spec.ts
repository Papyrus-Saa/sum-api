import { BadRequestException } from '@nestjs/common';
import { TireNormalizer } from './tire-normalizer';

describe('TireNormalizer', () => {
  let normalizer: TireNormalizer;

  beforeEach(() => {
    normalizer = new TireNormalizer();
  });

  describe('normalize', () => {
    describe('valid inputs', () => {
      it('normalizes size with lowercase r and spaces', () => {
        expect(normalizer.normalize('205/55 r16')).toBe('205/55R16');
        expect(normalizer.normalize('205 / 55 R16')).toBe('205/55R16');
        expect(normalizer.normalize('205/55R 16')).toBe('205/55R16');
      });

      it('handles multiple consecutive spaces', () => {
        expect(normalizer.normalize('205  /  55   R  16')).toBe('205/55R16');
        expect(normalizer.normalize('205    /55R16')).toBe('205/55R16');
      });

      it('handles tabs and mixed whitespace', () => {
        expect(normalizer.normalize('205\t/\t55\tR16')).toBe('205/55R16');
        expect(normalizer.normalize('205/55 \t R \t 16')).toBe('205/55R16');
      });

      it('normalizes already correct format', () => {
        expect(normalizer.normalize('205/55R16')).toBe('205/55R16');
      });

      it('handles edge case tire sizes', () => {
        expect(normalizer.normalize('145/80R13')).toBe('145/80R13');
        expect(normalizer.normalize('315/35R20')).toBe('315/35R20');
        expect(normalizer.normalize('125/70R15')).toBe('125/70R15');
      });

      it('handles extreme but valid numeric values', () => {
        expect(normalizer.normalize('100/20R10')).toBe('100/20R10');
        expect(normalizer.normalize('999/99R99')).toBe('999/99R99');
      });
    });

    describe('invalid inputs', () => {
      it('throws for incomplete size format', () => {
        expect(() => normalizer.normalize('205/55R')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.normalize('205/55')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.normalize('205')).toThrow(BadRequestException);
      });

      it('throws for alphabetic characters', () => {
        expect(() => normalizer.normalize('abc')).toThrow(BadRequestException);
        expect(() => normalizer.normalize('205/55Rabc')).toThrow(
          BadRequestException,
        );
      });

      it('throws for empty and whitespace-only input', () => {
        expect(() => normalizer.normalize('')).toThrow(BadRequestException);
        expect(() => normalizer.normalize('   ')).toThrow(BadRequestException);
        expect(() => normalizer.normalize('\t\t')).toThrow(BadRequestException);
      });

      it('throws for null and undefined input', () => {
        expect(() => normalizer.normalize(null as unknown as string)).toThrow(
          BadRequestException,
        );
        expect(() =>
          normalizer.normalize(undefined as unknown as string),
        ).toThrow(BadRequestException);
      });

      it('throws for special characters', () => {
        expect(() => normalizer.normalize('205/55R16!')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.normalize('205/55R16@')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.normalize('205-55-R16')).toThrow(
          BadRequestException,
        );
      });

      it('throws for missing slash separator', () => {
        expect(() => normalizer.normalize('20555R16')).toThrow(
          BadRequestException,
        );
      });

      it('throws for missing R designator', () => {
        expect(() => normalizer.normalize('205/55/16')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.normalize('205/5516')).toThrow(
          BadRequestException,
        );
      });

      it('throws for reversed format', () => {
        expect(() => normalizer.normalize('R16/55/205')).toThrow(
          BadRequestException,
        );
      });

      it('throws for decimal numbers', () => {
        expect(() => normalizer.normalize('205.5/55R16')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.normalize('205/55.5R16')).toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe('parseSizeComponents', () => {
    describe('valid inputs', () => {
      it('parses standard tire size with all components', () => {
        const result = normalizer.parseSizeComponents('205/55R16');
        expect(result).toEqual({
          sizeRaw: '205/55R16',
          sizeNormalized: '205/55R16',
          width: 205,
          aspectRatio: 55,
          rimDiameter: 16,
        });
      });

      it('parses size with spaces and normalizes', () => {
        const result = normalizer.parseSizeComponents('205 / 55 R 16');
        expect(result).toEqual({
          sizeRaw: '205 / 55 R 16',
          sizeNormalized: '205/55R16',
          width: 205,
          aspectRatio: 55,
          rimDiameter: 16,
        });
      });

      it('parses size with lowercase r', () => {
        const result = normalizer.parseSizeComponents('205/55r16');
        expect(result).toEqual({
          sizeRaw: '205/55r16',
          sizeNormalized: '205/55R16',
          width: 205,
          aspectRatio: 55,
          rimDiameter: 16,
        });
      });

      it('parses small tire size', () => {
        const result = normalizer.parseSizeComponents('145/80R13');
        expect(result).toEqual({
          sizeRaw: '145/80R13',
          sizeNormalized: '145/80R13',
          width: 145,
          aspectRatio: 80,
          rimDiameter: 13,
        });
      });

      it('parses large tire size', () => {
        const result = normalizer.parseSizeComponents('315/35R20');
        expect(result).toEqual({
          sizeRaw: '315/35R20',
          sizeNormalized: '315/35R20',
          width: 315,
          aspectRatio: 35,
          rimDiameter: 20,
        });
      });

      it('trims leading and trailing whitespace from raw', () => {
        const result = normalizer.parseSizeComponents('  205/55R16  ');
        expect(result.sizeRaw).toBe('205/55R16');
        expect(result.sizeNormalized).toBe('205/55R16');
      });
    });

    describe('invalid inputs', () => {
      it('throws for incomplete size', () => {
        expect(() => normalizer.parseSizeComponents('205/55')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.parseSizeComponents('205/55R')).toThrow(
          BadRequestException,
        );
      });

      it('throws for invalid format', () => {
        expect(() => normalizer.parseSizeComponents('abc')).toThrow(
          BadRequestException,
        );
        expect(() => normalizer.parseSizeComponents('205-55-R16')).toThrow(
          BadRequestException,
        );
      });

      it('throws for empty input', () => {
        expect(() => normalizer.parseSizeComponents('')).toThrow(
          BadRequestException,
        );
      });
    });
  });

  describe('parseVariant', () => {
    describe('valid inputs', () => {
      it('parses standard load and speed index', () => {
        expect(normalizer.parseVariant('91V')).toEqual({
          loadIndex: 91,
          speedIndex: 'V',
        });
      });

      it('parses different speed indices', () => {
        expect(normalizer.parseVariant('91H')).toEqual({
          loadIndex: 91,
          speedIndex: 'H',
        });
        expect(normalizer.parseVariant('91W')).toEqual({
          loadIndex: 91,
          speedIndex: 'W',
        });
        expect(normalizer.parseVariant('91Y')).toEqual({
          loadIndex: 91,
          speedIndex: 'Y',
        });
        expect(normalizer.parseVariant('91T')).toEqual({
          loadIndex: 91,
          speedIndex: 'T',
        });
      });

      it('parses low load index', () => {
        expect(normalizer.parseVariant('70Q')).toEqual({
          loadIndex: 70,
          speedIndex: 'Q',
        });
      });

      it('parses high load index', () => {
        expect(normalizer.parseVariant('120V')).toEqual({
          loadIndex: 120,
          speedIndex: 'V',
        });
      });

      it('parses three-digit load index', () => {
        expect(normalizer.parseVariant('100H')).toEqual({
          loadIndex: 100,
          speedIndex: 'H',
        });
      });
    });

    describe('invalid inputs', () => {
      it('throws for reversed format (letter first)', () => {
        expect(() => normalizer.parseVariant('V91')).toThrow(
          BadRequestException,
        );
      });

      it('throws for only numbers', () => {
        expect(() => normalizer.parseVariant('911')).toThrow(
          BadRequestException,
        );
      });

      it('throws for only letters', () => {
        expect(() => normalizer.parseVariant('VVV')).toThrow(
          BadRequestException,
        );
      });

      it('throws for multiple speed letters', () => {
        expect(() => normalizer.parseVariant('91VW')).toThrow(
          BadRequestException,
        );
      });

      it('throws for space in variant', () => {
        expect(() => normalizer.parseVariant('91 V')).toThrow(
          BadRequestException,
        );
      });
    });

    describe('null/empty inputs', () => {
      it('returns null for empty string', () => {
        expect(normalizer.parseVariant('')).toBeNull();
      });

      it('returns null for undefined', () => {
        expect(
          normalizer.parseVariant(undefined as unknown as string),
        ).toBeNull();
      });

      it('returns null for null', () => {
        expect(normalizer.parseVariant(null as unknown as string)).toBeNull();
      });
    });
  });
});
