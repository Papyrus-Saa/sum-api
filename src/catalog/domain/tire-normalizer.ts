import { Injectable, BadRequestException } from '@nestjs/common';
import {
  TIRE_SIZE_STRICT_PATTERN,
  TIRE_SIZE_ERROR_MESSAGE,
  VARIANT_PATTERN,
  VARIANT_ERROR_MESSAGE,
} from '../../common/constants/validation';

@Injectable()
export class TireNormalizer {
  /**
   * Normalize tire size: removes spaces, capitalizes R, validates format
   * Input: "205/55 r16", "205 / 55 R16"
   * Output: "205/55R16"
   */
  normalize(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new BadRequestException('Invalid tire size input');
    }

    // Remove all spaces
    let normalized = input.replace(/\s+/g, '');

    // Ensure R is uppercase
    normalized = normalized.replace(/r/i, 'R');

    // Validate format using constant pattern
    const match = normalized.match(TIRE_SIZE_STRICT_PATTERN);

    if (!match) {
      throw new BadRequestException(TIRE_SIZE_ERROR_MESSAGE);
    }

    return normalized;
  }

  /**
   * Parse tire size into components and normalized format
   * @param sizeRaw - Raw size input (e.g., "205/55 r16", "205 / 55 R16")
   * @returns Object with sizeRaw, sizeNormalized, width, aspectRatio, rimDiameter
   * @throws BadRequestException if format is invalid
   * @example
   * parseSizeComponents('205/55 r16') => { sizeRaw: '205/55 r16', sizeNormalized: '205/55R16', width: 205, aspectRatio: 55, rimDiameter: 16 }
   */
  parseSizeComponents(sizeRaw: string) {
    const normalized = this.normalize(sizeRaw);
    const match = normalized.match(TIRE_SIZE_STRICT_PATTERN);

    if (!match) {
      throw new BadRequestException(TIRE_SIZE_ERROR_MESSAGE);
    }

    const width = Number(match[1]);
    const aspectRatio = Number(match[2]);
    const rimDiameter = Number(match[3]);

    return {
      sizeRaw: sizeRaw.trim(),
      sizeNormalized: normalized,
      width,
      aspectRatio,
      rimDiameter,
    };
  }

  /**
   * Parse LI/SI from input like "91V"
   * Returns { loadIndex: 91, speedIndex: 'V' }
   */
  parseVariant(
    input: string,
  ): { loadIndex: number; speedIndex: string } | null {
    if (!input) return null;

    const match = input.match(VARIANT_PATTERN);

    if (!match) {
      throw new BadRequestException(VARIANT_ERROR_MESSAGE);
    }

    return {
      loadIndex: parseInt(match[1], 10),
      speedIndex: match[2],
    };
  }
}
