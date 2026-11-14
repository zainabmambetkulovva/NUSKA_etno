// Common TypeScript types for NUSKA_etno

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedRequest {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface FilterRequest extends PaginatedRequest {
  search?: string;
}

export interface CreatedResponse {
  id: string;
  createdAt: string;
}

export interface UpdatedResponse {
  id: string;
  updatedAt: string;
}

export interface DeletedResponse {
  id: string;
  deletedAt: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service?: string;
}

export type Language = 'ru' | 'ky';

export interface Translation {
  locale: Language;
  name: string;
  description?: string;
}

export interface Price {
  amount: number;
  currency: string;
}

export interface Inventory {
  quantity: number;
  trackInventory: boolean;
}

export * from './api';
