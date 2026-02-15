import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LookupService } from '../services/lookup.service';

@Controller('api/v1/lookup')
export class LookupController {
  constructor(private readonly lookupService: LookupService) { }

  @Get()
  async search(
    @Query('code') code?: string,
    @Query('size') size?: string,
    @Query('li') li?: string,
    @Query('si') si?: string,
  ) {
    if (!code && !size) {
      throw new BadRequestException('Either "code" or "size" parameter is required');
    }

    if (code && size) {
      throw new BadRequestException('Please provide either "code" or "size", not both');
    }

    if (code) {
      return this.lookupService.findByCode(code, { li, si });
    }

    // size is guaranteed to be defined here
    return this.lookupService.findBySize(size!, { li, si });
  }
}


