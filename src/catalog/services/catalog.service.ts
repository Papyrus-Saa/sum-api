import { Injectable, Logger } from '@nestjs/common';
import { TireSizeRepository } from '../repositories/tire-size.repository';
import { TireCodeRepository } from '../repositories/tire-code.repository';
import { TireVariantRepository } from '../repositories/tire-variant.repository';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly tireSizeRepository: TireSizeRepository,
    private readonly tireCodeRepository: TireCodeRepository,
    private readonly tireVariantRepository: TireVariantRepository,
  ) { }

  // TireSize operations
  /**
   * Get tire size by normalized format
   * @param sizeNormalized - Size in XXX/XXRXX format
   * @returns Tire size data or null
   */
  async getTireSizeByNormalized(sizeNormalized: string) {
    return this.tireSizeRepository.findByNormalized(sizeNormalized);
  }

  async getTireSizeById(id: string) {
    return this.tireSizeRepository.findById(id);
  }

  async getAllTireSizes() {
    return this.tireSizeRepository.findAll();
  }

  // TireCode operations
  async getTireCodeByPublicCode(code: string) {
    return this.tireCodeRepository.findByCode(code);
  }

  async getTireCodeByTireSizeId(tireSizeId: string) {
    return this.tireCodeRepository.findByTireSizeId(tireSizeId);
  }

  async getAllTireCodes() {
    return this.tireCodeRepository.findAll();
  }

  // TireVariant operations
  async getVariantsByTireSizeId(tireSizeId: string) {
    return this.tireVariantRepository.findByTireSizeId(tireSizeId);
  }
}