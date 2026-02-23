import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  SearchLogService,
  TopSearchItem,
} from '../../observability/services/search-log.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@Controller('api/v1/admin/analytics')
@SkipThrottle()
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly searchLogService: SearchLogService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get search analytics overview',
    description:
      'Returns overall search statistics including total searches, success rate, and breakdowns by query type.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to include in analytics',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics data retrieved successfully',
    schema: {
      example: {
        totalSearches: 1250,
        successfulSearches: 1100,
        failedSearches: 150,
        successRate: '88.00%',
        searchesByType: [
          { type: 'code', count: 650 },
          { type: 'size', count: 600 },
        ],
        recentSearches: [
          {
            query: '205/55R16',
            queryType: 'size',
            resultFound: true,
            createdAt: '2026-02-16T14:30:00.000Z',
          },
        ],
      },
    },
  })
  async getOverview(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    return this.searchLogService.getAnalytics({
      startDate,
      limit: 10,
    });
  }

  @Get('top-searches')
  @ApiOperation({
    summary: 'Get most searched queries',
    description:
      'Returns the most frequently searched queries within a specified time period.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
    example: 10,
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Top searches retrieved successfully',
    schema: {
      example: [
        {
          query: '205/55R16',
          queryType: 'size',
          resultFound: true,
          count: 45,
        },
        {
          query: '100',
          queryType: 'code',
          resultFound: true,
          count: 38,
        },
      ],
    },
  })
  async getTopSearches(
    @Query('limit') limit?: string,
    @Query('days') days?: string,
  ): Promise<TopSearchItem[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const daysNum = days ? parseInt(days, 10) : 7;

    return this.searchLogService.getTopSearches({
      limit: limitNum,
      days: daysNum,
    });
  }
}
