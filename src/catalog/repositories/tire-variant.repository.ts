import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface ITireVariant {
  id: string;
  tireSizeId: string;
  loadIndex: number | null;
  speedIndex: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTireVariantDto {
  tireSizeId: string;
  loadIndex?: number | null;
  speedIndex?: string | null;
}

@Injectable()
export class TireVariantRepository {
  constructor(private prisma: PrismaService) {}

  async findByTireSizeId(tireSizeId: string): Promise<ITireVariant[]> {
    return this.prisma.tireVariant.findMany({
      where: { tireSizeId },
    });
  }

  async create(data: ICreateTireVariantDto): Promise<ITireVariant> {
    return this.prisma.tireVariant.create({ data });
  }

  async findAll(): Promise<ITireVariant[]> {
    return this.prisma.tireVariant.findMany();
  }
}
