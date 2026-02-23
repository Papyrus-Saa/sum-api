import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

interface LogSearchParams {
  query: string;
  queryType: 'code' | 'size' | 'unknown';
  resultFound: boolean;
  ip?: string;
}

export interface SearchAnalyticsOverview {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  successRate: string;
  searchesByType: Array<{ type: string; count: number }>;
  recentSearches: Array<{
    query: string;
    queryType: string;
    resultFound: boolean;
    createdAt: Date;
  }>;
}

export interface TopSearchItem {
  query: string;
  queryType: string;
  resultFound: boolean;
  count: number;
}

@Injectable()
export class SearchLogService {
  private readonly logger = new Logger(SearchLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a search query asynchronously (fire and forget)
   * @param params - Search parameters
   */
  async logSearch(params: LogSearchParams): Promise<void> {
    try {
      const ipHash = params.ip ? this.hashIp(params.ip) : null;

      await this.prisma.searchLog.create({
        data: {
          query: params.query,
          queryType: params.queryType,
          resultFound: params.resultFound,
          ipHash,
        },
      });

      this.logger.debug(
        `Search logged: query="${params.query}", type=${params.queryType}, found=${params.resultFound}`,
      );
    } catch (error) {
      // Don't throw - logging failures shouldn't break the search
      this.logger.error(
        `Failed to log search: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get search analytics
   */
  async getAnalytics(options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<SearchAnalyticsOverview> {
    const where = {
      ...(options?.startDate && { createdAt: { gte: options.startDate } }),
      ...(options?.endDate && {
        createdAt: { ...options?.startDate, lte: options.endDate },
      }),
    };

    const [totalSearches, successfulSearches, searchesByType, recentSearches] =
      await Promise.all([
        // Total searches
        this.prisma.searchLog.count({ where }),

        // Successful searches
        this.prisma.searchLog.count({
          where: { ...where, resultFound: true },
        }),

        // Searches by type
        this.prisma.searchLog.groupBy({
          by: ['queryType'],
          where,
          _count: {
            queryType: true,
          },
        }),

        // Recent searches
        this.prisma.searchLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: options?.limit ?? 10,
          select: {
            query: true,
            queryType: true,
            resultFound: true,
            createdAt: true,
          },
        }),
      ]);

    const successRate =
      totalSearches > 0
        ? ((successfulSearches / totalSearches) * 100).toFixed(2)
        : '0.00';

    return {
      totalSearches,
      successfulSearches,
      failedSearches: totalSearches - successfulSearches,
      successRate: `${successRate}%`,
      searchesByType: searchesByType.map((item) => ({
        type: item.queryType,
        count: item._count.queryType,
      })),
      recentSearches,
    };
  }

  /**
   * Get most searched queries
   */
  async getTopSearches(options?: {
    limit?: number;
    days?: number;
  }): Promise<TopSearchItem[]> {
    const limit = options?.limit ?? 10;
    const days = options?.days ?? 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const searches = await this.prisma.searchLog.groupBy({
      by: ['query', 'queryType', 'resultFound'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: {
        query: true,
      },
      orderBy: {
        _count: {
          query: 'desc',
        },
      },
      take: limit,
    });

    return searches.map((item) => ({
      query: item.query,
      queryType: item.queryType,
      resultFound: item.resultFound,
      count: item._count.query,
    }));
  }

  /**
   * Hash IP address for privacy (GDPR compliant)
   */
  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }
}
