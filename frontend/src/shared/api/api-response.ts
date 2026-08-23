/**
 * Backend success envelope, per docs/06-api/conventions.md: { success, message, data, meta }.
 */
export interface ApiListMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta: ApiListMeta | null;
}
