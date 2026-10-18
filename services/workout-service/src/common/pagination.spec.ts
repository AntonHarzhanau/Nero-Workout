import { createPaginatedResult } from './pagination.js';

describe('createPaginatedResult', () => {
  it.each([
    { total: 0, page: 1, pages: 0, next: false, previous: false },
    { total: 0, page: 2, pages: 0, next: false, previous: false },
    { total: 10, page: 1, pages: 1, next: false, previous: false },
    { total: 21, page: 1, pages: 3, next: true, previous: false },
    { total: 21, page: 2, pages: 3, next: true, previous: true },
    { total: 21, page: 3, pages: 3, next: false, previous: true },
    { total: 21, page: 4, pages: 3, next: false, previous: true },
    { total: 20, page: 2, pages: 2, next: false, previous: true },
  ])(
    'builds navigation for total=$total page=$page',
    ({ total, page, pages, next, previous }) => {
      const data = [{ id: 'item' }];
      expect(createPaginatedResult(data, total, page, 10)).toEqual({
        data,
        meta: {
          page,
          limit: 10,
          total,
          totalPages: pages,
          hasNextPage: next,
          hasPreviousPage: previous,
        },
      });
      expect(createPaginatedResult(data, total, page, 10).data).toBe(data);
    },
  );
});
