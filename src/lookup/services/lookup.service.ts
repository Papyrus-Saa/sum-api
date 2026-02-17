import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CatalogService } from '../../catalog/services/catalog.service';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';
import { SearchLogService } from '../../observability/services/search-log.service';

@Injectable()
export class LookupService {
  private readonly logger = new Logger(LookupService.name);

  constructor(
    private readonly catalogService: CatalogService,
    private readonly tireNormalizer: TireNormalizer,
    private readonly searchLogService: SearchLogService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  /**
   * Search by tire code (e.g., "100")
   * Returns: { code, sizeNormalized, sizeRaw, variants? }
   */
  async findByCode(
    code: string,
    options?: { li?: string; si?: string; ip?: string },
  ) {
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

    const cacheKey = this.buildCodeCacheKey(resolvedCode, variant);
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for code lookup: ${cacheKey}`);
      return cached;
    }

    // Optimized: Fetch code and then size + variants in parallel
    const tireCode =
      await this.catalogService.getTireCodeByPublicCode(resolvedCode);
    if (!tireCode) {
      this.logger.warn(`Tire code not found: ${resolvedCode}`);
      // Log failed search
      void this.searchLogService.logSearch({
        query: resolvedCode,
        queryType: 'code',
        resultFound: false,
        ip: options?.ip,
      });
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
        const response = {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          variant: {
            loadIndex: matched.loadIndex,
            speedIndex: matched.speedIndex,
          },
        };
        await this.cache.set(cacheKey, response, 60 * 60 * 1000);
        return response;
      } else {
        this.logger.warn(
          `Variant not found: code=${resolvedCode}, variant=${variant?.loadIndex}${variant?.speedIndex}`,
        );
        const response = {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          warning: 'variant_not_found',
        };
        await this.cache.set(cacheKey, response, 60 * 60 * 1000);
        return response;
      }
    }

    this.logger.log(`Lookup successful: code=${resolvedCode}`);
    const response = {
      code: tireCode.codePublic,
      sizeNormalized: tireSize.sizeNormalized,
      sizeRaw: tireSize.sizeRaw,
      ...(variants && variants.length > 0 && { variants }),
    };
    await this.cache.set(cacheKey, response, 60 * 60 * 1000);
    // Log successful search
    void this.searchLogService.logSearch({
      query: resolvedCode,
      queryType: 'code',
      resultFound: true,
      ip: options?.ip,
    });
    return response;
  }

  /**
   * Search by tire size (e.g., "205/55R16")
   * Returns: { code, sizeNormalized, sizeRaw, variants? }
   */
  async findBySize(
    size: string,
    options?: { li?: string; si?: string; ip?: string },
  ) {
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

    const cacheKey = this.buildSizeCacheKey(normalized, variant);
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for size lookup: ${cacheKey}`);
      return cached;
    }

    // Optimized: Fetch size and then code + variants in parallel
    const tireSize =
      await this.catalogService.getTireSizeByNormalized(normalized);
    if (!tireSize) {
      this.logger.warn(`Tire size not found: ${normalized}`);
      // Log failed search
      void this.searchLogService.logSearch({
        query: normalized,
        queryType: 'size',
        resultFound: false,
        ip: options?.ip,
      });
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
        const response = {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          variant: {
            loadIndex: matched.loadIndex,
            speedIndex: matched.speedIndex,
          },
        };
        await this.cache.set(cacheKey, response, 60 * 60 * 1000);
        return response;
      } else {
        this.logger.warn(
          `Variant not found: size=${normalized}, variant=${variant.loadIndex}${variant.speedIndex}`,
        );
        const response = {
          code: tireCode.codePublic,
          sizeNormalized: tireSize.sizeNormalized,
          sizeRaw: tireSize.sizeRaw,
          warning: 'variant_not_found',
        };
        await this.cache.set(cacheKey, response, 60 * 60 * 1000);
        return response;
      }
    }

    this.logger.log(`Lookup successful: size=${normalized}`);
    const response = {
      code: tireCode.codePublic,
      sizeNormalized: tireSize.sizeNormalized,
      sizeRaw: tireSize.sizeRaw,
      ...(variants && variants.length > 0 && { variants }),
    };
    await this.cache.set(cacheKey, response, 60 * 60 * 1000);
    // Log successful search
    void this.searchLogService.logSearch({
      query: normalized,
      queryType: 'size',
      resultFound: true,
      ip: options?.ip,
    });
    return response;
  }

  private buildCodeCacheKey(
    code: string,
    variant: { loadIndex: number | null; speedIndex: string | null } | null,
  ): string {
    const variantKey = variant
      ? `${variant.loadIndex ?? ''}${variant.speedIndex ?? ''}`
      : 'base';
    return `lookup:code:${code}:${variantKey}`;
  }

  private buildSizeCacheKey(
    sizeNormalized: string,
    variant: { loadIndex: number | null; speedIndex: string | null } | null,
  ): string {
    const variantKey = variant
      ? `${variant.loadIndex ?? ''}${variant.speedIndex ?? ''}`
      : 'base';
    return `lookup:size:${sizeNormalized}:${variantKey}`;
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
