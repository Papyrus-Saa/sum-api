import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { LookupService } from '../services/lookup.service';

@ApiTags('Lookup')
@Controller('api/v1/lookup')
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Get()
  @ApiOperation({
    summary: 'Search tire by code or size',
    description:
      'Find tire information by code (e.g., "100") or normalized size (e.g., "205/55R16"). Optionally filter by variant (LI/SI).',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Tire code (e.g., "100", "100 91V")',
    example: '100',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description:
      'Tire size in format XXX/XXRXX (e.g., "205/55R16", "205/55 r16")',
    example: '205/55R16',
  })
  @ApiQuery({
    name: 'li',
    required: false,
    description: 'Load Index (must be provided with si)',
    example: '91',
  })
  @ApiQuery({
    name: 'si',
    required: false,
    description: 'Speed Index letter (must be provided with li)',
    example: 'V',
  })
  @ApiOkResponse({
    description: 'Tire found successfully',
    schema: {
      example: {
        code: '100',
        sizeNormalized: '205/55R16',
        sizeRaw: '205/55R16',
        variant: { loadIndex: 91, speedIndex: 'V' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing or conflicting parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'Tire code or size not found',
  })
  async search(
    @Query('code') code?: string,
    @Query('size') size?: string,
    @Query('li') li?: string,
    @Query('si') si?: string,
  ) {
    if (!code && !size) {
      throw new BadRequestException(
        'Either "code" or "size" parameter is required',
      );
    }

    if (code && size) {
      throw new BadRequestException(
        'Please provide either "code" or "size", not both',
      );
    }

    if (code) {
      return this.lookupService.findByCode(code, { li, si });
    }

    // size is guaranteed to be defined here
    return this.lookupService.findBySize(size!, { li, si });
  }
}
