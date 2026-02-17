import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SuggestionDto {
  sizeNormalized: string;
  searchCount: number;
}

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get tire size suggestions based on query prefix
   * Combines popular searches (from SearchLog) with existing catalog (TireSize)
   * @param query - Partial tire size (e.g., "205", "205/55", "205/55R")
   * @param limit - Maximum number of suggestions to return (default: 10)
   * @returns Array of tire size suggestions with search frequency
   */
  async getSuggestions(
    query: string,
    limit: number = 10,
  ): Promise<SuggestionDto[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.trim().toUpperCase().replace(/\s+/g, '');

    // Strategy 1: Get popular searches from SearchLog
    const popularSearches = await this.getPopularSearches(
      normalizedQuery,
      limit,
    );

    // Strategy 2: If not enough results, complement with catalog sizes
    if (popularSearches.length < limit) {
      const catalogSizes = await this.getCatalogSizes(
        normalizedQuery,
        limit - popularSearches.length,
        popularSearches.map((s) => s.sizeNormalized),
      );

      return [...popularSearches, ...catalogSizes];
    }

    return popularSearches;
  }

  /**
   * Get popular tire sizes from search logs
   * @private
   */
  private async getPopularSearches(
    query: string,
    limit: number,
  ): Promise<SuggestionDto[]> {
    // Query SearchLog for successful searches that match the prefix
    const results = await this.prisma.searchLog.groupBy({
      by: ['query'],
      where: {
        query: {
          startsWith: query,
          mode: 'insensitive',
        },
        resultFound: true,
        queryType: 'size', // Only size searches
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

    return results.map((r) => ({
      sizeNormalized: r.query,
      searchCount: r._count.query,
    }));
  }

  /**
   * Get tire sizes from catalog that match the query prefix
   * @private
   */
  private async getCatalogSizes(
    query: string,
    limit: number,
    exclude: string[],
  ): Promise<SuggestionDto[]> {
    const results = await this.prisma.tireSize.findMany({
      where: {
        sizeNormalized: {
          startsWith: query,
          notIn: exclude.length > 0 ? exclude : undefined,
        },
      },
      select: {
        sizeNormalized: true,
      },
      orderBy: {
        createdAt: 'desc', // More recent first
      },
      take: limit,
    });

    return results.map((r) => ({
      sizeNormalized: r.sizeNormalized,
      searchCount: 0, // No search count from catalog
    }));
  }
}
