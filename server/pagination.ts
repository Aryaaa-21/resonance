import { z } from "zod";

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export interface Pagination {
  readonly page: number;
  readonly pageSize: number;
  readonly skip: number;
  readonly take: number;
}

export function parsePagination(request: Request): Pagination {
  const url = new URL(request.url);
  const parsed = paginationQuery.parse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? url.searchParams.get("limit") ?? undefined,
  });
  return { ...parsed, skip: (parsed.page - 1) * parsed.pageSize, take: parsed.pageSize };
}

export function paginationMeta(pagination: Pagination, total: number) {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    total,
    hasNextPage: pagination.skip + pagination.take < total,
  };
}
