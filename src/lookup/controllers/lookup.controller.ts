import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { LookupService } from '../services/lookup.service';
import { SuggestionsService } from '../services/suggestions.service';

@ApiTags('Lookup')
@Controller('api/v1/lookup')
export class LookupController {
  constructor(
    private readonly lookupService: LookupService,
    private readonly suggestionsService: SuggestionsService,
  ) {}

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
    @Req() req?: Request,
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

    const ip = req?.ip || req?.socket?.remoteAddress;

    if (code) {
      return this.lookupService.findByCode(code, { li, si, ip });
    }

    // size is guaranteed to be defined here
    return this.lookupService.findBySize(size!, { li, si, ip });
  }

  @Get('suggestions')
  @ApiOperation({
    summary: 'Get tire size suggestions (autocomplete)',
    description:
      'Returns tire size suggestions based on partial query. Combines popular searches with catalog sizes.',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Partial tire size query (e.g., "205", "205/55", "205/55R")',
    example: '205',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of suggestions to return (default: 10)',
    example: 10,
  })
  @ApiOkResponse({
    description: 'List of tire size suggestions',
    schema: {
      example: [
        { sizeNormalized: '205/55R16', searchCount: 42 },
        { sizeNormalized: '205/60R15', searchCount: 28 },
        { sizeNormalized: '205/50R17', searchCount: 15 },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing query parameter',
  })
  async getSuggestions(
    @Query('query') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) {
      throw new BadRequestException('Query parameter is required');
    }

    const parsedLimit = limit ? parseInt(limit, 10) : 10;

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    return this.suggestionsService.getSuggestions(query, parsedLimit);
  }
}
