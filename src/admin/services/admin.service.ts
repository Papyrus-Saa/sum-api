import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tireNormalizer: TireNormalizer,
  ) { }

  /**
   * Create a new tire mapping with code and size
   * @param input - Object containing codePublic and sizeRaw
   * @returns Created mapping with normalized data
   * @throws BadRequestException if inputs are invalid
   * @throws ConflictException if code or size already exists
   * @example
   * createMapping({ codePublic: '100', sizeRaw: '205/55R16' })
   */
  async createMapping(input: { codePublic: string; sizeRaw: string }) {
    const { codePublic, sizeRaw } = input;
    this.logger.debug(`Creating mapping: code=${codePublic}, size=${sizeRaw}`);

    if (!codePublic?.trim() || !sizeRaw?.trim()) {
      this.logger.warn(`Missing required fields: code=${codePublic}, size=${sizeRaw}`);
      throw new BadRequestException('Both "codePublic" and "sizeRaw" are required');
    }

    const sizeData = this.tireNormalizer.parseSizeComponents(sizeRaw);

    const existingCode = await this.prisma.tireCode.findUnique({
      where: { codePublic: codePublic.trim() },
    });

    if (existingCode) {
      this.logger.warn(`Tire code already exists: ${codePublic}`);
      throw new ConflictException(`Tire code "${codePublic}" already exists`);
    }

    let tireSize = await this.prisma.tireSize.findUnique({
      where: { sizeNormalized: sizeData.sizeNormalized },
    });

    if (!tireSize) {
      tireSize = await this.prisma.tireSize.create({
        data: sizeData,
      });
    } else {
      const existingMapping = await this.prisma.tireCode.findUnique({
        where: { tireSizeId: tireSize.id },
      });

      if (existingMapping) {
        this.logger.warn(`Tire size already mapped: ${sizeData.sizeNormalized}`);
        throw new ConflictException(
          `Tire size "${sizeData.sizeNormalized}" already has a mapping`,
        );
      }
    }

    const tireCode = await this.prisma.tireCode.create({
      data: {
        codePublic: codePublic.trim(),
        tireSizeId: tireSize.id,
      },
    });

    this.logger.log(`Mapping created: id=${tireCode.id}, code=${tireCode.codePublic}`);

    return {
      id: tireCode.id,
      codePublic: tireCode.codePublic,
      sizeRaw: tireSize.sizeRaw,
      sizeNormalized: tireSize.sizeNormalized,
    };
  }

  /**
   * Update an existing tire mapping
   * @param id - Mapping ID to update
   * @param input - Object containing optional codePublic and/or sizeRaw
   * @returns Updated mapping with normalized data
   * @throws NotFoundException if mapping not found
   * @throws BadRequestException if no fields provided
   * @throws ConflictException if code or size already exists
   * @example
   * updateMapping('uuid', { codePublic: '101' })
   */
  async updateMapping(
    id: string,
    input: { codePublic?: string; sizeRaw?: string },
  ) {
    this.logger.debug(`Updating mapping: id=${id}, input=${JSON.stringify(input)}`);

    if (!input.codePublic?.trim() && !input.sizeRaw?.trim()) {
      this.logger.warn(`No fields provided to update mapping: ${id}`);
      throw new BadRequestException('Provide "codePublic" or "sizeRaw" to update');
    }

    const existing = await this.prisma.tireCode.findUnique({
      where: { id },
      include: { tireSize: true },
    });

    if (!existing) {
      this.logger.warn(`Mapping not found for update: ${id}`);
      throw new NotFoundException(`Mapping "${id}" not found`);
    }

    let updatedCodePublic = existing.codePublic;
    let updatedSize = existing.tireSize;

    if (input.codePublic?.trim()) {
      const newCode = input.codePublic.trim();
      const codeConflict = await this.prisma.tireCode.findUnique({
        where: { codePublic: newCode },
      });

      if (codeConflict && codeConflict.id !== id) {
        this.logger.warn(`Code conflict during update: ${newCode}`);
        throw new ConflictException(`Tire code "${newCode}" already exists`);
      }

      const updatedCode = await this.prisma.tireCode.update({
        where: { id },
        data: { codePublic: newCode },
      });
      this.logger.log(`Code updated: id=${id}, newCode=${newCode}`);
      updatedCodePublic = updatedCode.codePublic;
    }

    if (input.sizeRaw?.trim()) {
      const sizeData = this.tireNormalizer.parseSizeComponents(input.sizeRaw);
      const sizeConflict = await this.prisma.tireSize.findUnique({
        where: { sizeNormalized: sizeData.sizeNormalized },
      });

      if (sizeConflict && sizeConflict.id !== existing.tireSizeId) {
        this.logger.warn(`Size conflict during update: ${sizeData.sizeNormalized}`);
        throw new ConflictException(
          `Tire size "${sizeData.sizeNormalized}" already exists`,
        );
      }

      this.logger.log(`Size updated: id=${id}, newSize=${sizeData.sizeNormalized}`);
      updatedSize = await this.prisma.tireSize.update({
        where: { id: existing.tireSizeId },
        data: sizeData,
      });
    }

    return {
      id: existing.id,
      codePublic: updatedCodePublic,
      sizeRaw: updatedSize.sizeRaw,
      sizeNormalized: updatedSize.sizeNormalized,
    };
  }

  /**
   * Delete a tire mapping by ID
   * @param id - Mapping ID to delete
   * @returns Deleted mapping data
   * @throws NotFoundException if mapping not found
   * @example
   * deleteMapping('uuid')
   */
  async deleteMapping(id: string) {
    this.logger.debug(`Deleting mapping: ${id}`);
    const existing = await this.prisma.tireCode.findUnique({
      where: { id },
      include: { tireSize: true },
    });

    if (!existing) {
      this.logger.warn(`Mapping not found for delete: ${id}`);
      throw new NotFoundException(`Mapping "${id}" not found`);
    }

    await this.prisma.tireSize.delete({
      where: { id: existing.tireSizeId },
    });

    this.logger.log(`Mapping deleted: id=${id}, code=${existing.codePublic}`);

    return {
      id: existing.id,
      codePublic: existing.codePublic,
      sizeRaw: existing.tireSize.sizeRaw,
      sizeNormalized: existing.tireSize.sizeNormalized,
    };
  }
}
