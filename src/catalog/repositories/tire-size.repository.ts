import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ITireSize, ICreateTireSizeDto } from './entities';

@Injectable()
export class TireSizeRepository {
  constructor(private prisma: PrismaService) {}

  async findByNormalized(normalized: string): Promise<ITireSize | null> {
    return this.prisma.tireSize.findUnique({
      where: { sizeNormalized: normalized },
    });
  }

  async findById(id: string): Promise<ITireSize | null> {
    return this.prisma.tireSize.findUnique({
      where: { id },
    });
  }

  async create(data: ICreateTireSizeDto): Promise<ITireSize> {
    return this.prisma.tireSize.create({ data });
  }

  async findAll(): Promise<ITireSize[]> {
    return this.prisma.tireSize.findMany();
  }
}
