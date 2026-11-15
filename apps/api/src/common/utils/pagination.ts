export interface Paginated<T> {
  data: T[];
  meta: { total: number; limit: number; offset: number };
}

export const DEFAULT_LIMIT = 20;

export function paginate<T>(data: T[], total: number, limit: number, offset: number): Paginated<T> {
  return { data, meta: { total, limit, offset } };
}
