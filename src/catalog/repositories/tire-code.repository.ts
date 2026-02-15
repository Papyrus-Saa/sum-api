import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ITireCode, ICreateTireCodeDto } from './entities';

@Injectable()
export class TireCodeRepository {
  constructor(private prisma: PrismaService) { }

  async findByCode(code: string): Promise<ITireCode | null> {
    return this.prisma.tireCode.findUnique({
      where: { codePublic: code },
    });
  }

  async findByTireSizeId(tireSizeId: string): Promise<ITireCode | null> {
    return this.prisma.tireCode.findUnique({
      where: { tireSizeId },
    });
  }

  async create(data: ICreateTireCodeDto): Promise<ITireCode> {
    return this.prisma.tireCode.create({ data });
  }

  async findAll(): Promise<ITireCode[]> {
    return this.prisma.tireCode.findMany();
  }
}
