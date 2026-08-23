import type { AxiosRequestConfig } from 'axios';
import { apiClient } from './api-client';
import type { ApiEnvelope } from './api-response';

/**
 * Shared HTTP verb helpers. Every feature API service composes these instead
 * of calling Axios directly, so response unwrapping and error normalization
 * stay in one place (errors are already normalized by the api-client
 * response interceptor by the time they reach a caller).
 */
async function unwrapData<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

async function unwrapEnvelope<T>(
  promise: Promise<{ data: ApiEnvelope<T> }>,
): Promise<ApiEnvelope<T>> {
  const response = await promise;
  return response.data;
}

export const baseApiService = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return unwrapData(apiClient.get<ApiEnvelope<T>>(url, config));
  },
  getWithEnvelope<T>(url: string, config?: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
    return unwrapEnvelope(apiClient.get<ApiEnvelope<T>>(url, config));
  },
  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrapData(apiClient.post<ApiEnvelope<T>>(url, body, config));
  },
  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrapData(apiClient.put<ApiEnvelope<T>>(url, body, config));
  },
  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return unwrapData(apiClient.patch<ApiEnvelope<T>>(url, body, config));
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return unwrapData(apiClient.delete<ApiEnvelope<T>>(url, config));
  },
};
