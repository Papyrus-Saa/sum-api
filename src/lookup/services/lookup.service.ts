import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CatalogService } from '../../catalog/services/catalog.service';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';

@Injectable()
export class LookupService {
  private readonly logger = new Logger(LookupService.name);

  constructor(
    private readonly catalogService: CatalogService,
    private readonly tireNormalizer: TireNormalizer,
  ) {}

  /**
   * Search by tire code (e.g., "100")
   * Returns: { code, sizeNormalized, sizeRaw, variants? }
   */
  async findByCode(code: string, options?: { li?: string; si?: string }) {
    this.logger.debug(
      `Lookup by code: code=${code}, li=${options?.li}, si=${options?.si}`,
    );
    const { code: resolvedCode, variant } = this.resolveVariantInput(
      code,
      undefined,
      options?.li,
      options?.si,
    );
    if (!resolvedCode) {
      this.logger.warn(`Invalid code lookup: code is empty`);
      throw new BadRequestException('"code" is required');
    }

    // Optimized: Fetch code and then size + variants in parallel
    const tireCode =
      await this.catalogService.getTireCodeByPublicCode(resolvedCode);
    if (!tireCode) {
      this.logger.warn(`Tire code not found: ${resolvedCode}`);
      throw new NotFoundException(`Tire code "${resolvedCode}" not found`);
    }
    this.logger.debug(`Found tire code: ${resolvedCode}`);

    const [tireSize, variants] = await Promise.all([
      this.catalogService.getTireSizeById(tireCode.tireSizeId),
      this.catalogService.getVariantsByTireSizeId(tireCode.tireSizeId),
    ]);

    if (!tireSize) {
      this.logger.error(`Tire size not found for code: ${resolvedCode}`);
      throw new NotFoundException(`Tire size data not found`);
    }

    this.logger.debug(`Found tire size: ${tireSize.sizeNormalized}`);

    if (variant) {
      const matched = variants.find(
        (item) =>
          item.loadIndex === variant.loadIndex &&
          item.speedIndex === variant.speedIndex,
      );

      if (matched) {
        this.logger.log(
          `Lookup successful: code=${resolvedCode}, variant=${variant?.loadIndex}${variant?.speedIndex}`,
        );
        return {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          variant: {
            loadIndex: matched.loadIndex,
            speedIndex: matched.speedIndex,
          },
        };
      } else {
        this.logger.warn(
          `Variant not found: code=${resolvedCode}, variant=${variant?.loadIndex}${variant?.speedIndex}`,
        );
        return {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          warning: 'variant_not_found',
        };
      }
    }

    this.logger.log(`Lookup successful: code=${resolvedCode}`);
    return {
      code: tireCode.codePublic,
      sizeNormalized: tireSize.sizeNormalized,
      sizeRaw: tireSize.sizeRaw,
      ...(variants && variants.length > 0 && { variants }),
    };
  }

  /**
   * Search by tire size (e.g., "205/55R16")
   * Returns: { code, sizeNormalized, sizeRaw, variants? }
   */
  async findBySize(size: string, options?: { li?: string; si?: string }) {
    this.logger.debug(
      `Lookup by size: size=${size}, li=${options?.li}, si=${options?.si}`,
    );
    const { size: resolvedSize, variant } = this.resolveVariantInput(
      undefined,
      size,
      options?.li,
      options?.si,
    );
    if (!resolvedSize) {
      this.logger.warn(`Invalid size lookup: size is empty`);
      throw new BadRequestException('"size" is required');
    }
    const normalized = this.tireNormalizer.normalize(resolvedSize);
    this.logger.debug(`Normalized size: ${resolvedSize} -> ${normalized}`);

    // Optimized: Fetch size and then code + variants in parallel
    const tireSize =
      await this.catalogService.getTireSizeByNormalized(normalized);
    if (!tireSize) {
      this.logger.warn(`Tire size not found: ${normalized}`);
      throw new NotFoundException(`Tire size "${normalized}" not found`);
    }

    this.logger.debug(`Found tire size: ${normalized}`);

    const [tireCode, variants] = await Promise.all([
      this.catalogService.getTireCodeByTireSizeId(tireSize.id),
      this.catalogService.getVariantsByTireSizeId(tireSize.id),
    ]);

    if (!tireCode) {
      this.logger.error(`No code found for tire size: ${normalized}`);
      throw new NotFoundException(
        `No code found for tire size "${normalized}"`,
      );
    }

    if (variant) {
      const matched = variants.find(
        (item) =>
          item.loadIndex === variant.loadIndex &&
          item.speedIndex === variant.speedIndex,
      );

      if (matched) {
        this.logger.log(
          `Lookup successful: size=${normalized}, variant=${variant.loadIndex}${variant.speedIndex}`,
        );
        return {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          variant: {
            loadIndex: matched.loadIndex,
            speedIndex: matched.speedIndex,
          },
        };
      } else {
        this.logger.warn(
          `Variant not found: size=${normalized}, variant=${variant.loadIndex}${variant.speedIndex}`,
        );
        return {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          warning: 'variant_not_found',
        };
      }
    }

    this.logger.log(`Lookup successful: size=${normalized}`);
    return {
      code: tireCode.codePublic,
      sizeNormalized: tireSize.sizeNormalized,
      sizeRaw: tireSize.sizeRaw,
      ...(variants && variants.length > 0 && { variants }),
    };
  }

  private resolveVariantInput(
    code?: string,
    size?: string,
    li?: string,
    si?: string,
  ) {
    let resolvedCode = code?.trim();
    let resolvedSize = size?.trim();
    let variantToken: string | undefined;

    if (li || si) {
      if (!li || !si) {
        this.logger.warn(`Incomplete variant params: li=${li}, si=${si}`);
        throw new BadRequestException('Both "li" and "si" are required');
      }
      variantToken = `${li}${si}`;
    }

    if (!variantToken && resolvedCode) {
      const parts = resolvedCode.split(/\s+/);
      if (parts.length > 1) {
        resolvedCode = parts[0];
        variantToken = parts[1];
      }
    }

    if (!variantToken && resolvedSize) {
      const match = resolvedSize.match(/\s+(\d+[A-Za-z])\s*$/);
      if (match?.index !== undefined) {
        variantToken = match[1];
        resolvedSize = resolvedSize.slice(0, match.index).trim();
      }
    }

    if (!variantToken) {
      return { code: resolvedCode, size: resolvedSize, variant: null };
    }

    const variant = this.tireNormalizer.parseVariant(
      variantToken.toUpperCase(),
    );

    return { code: resolvedCode, size: resolvedSize, variant };
  }
}
