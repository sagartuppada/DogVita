/**
 * API client for making HTTP requests
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '../../types';
// @ts-ignore - react-native-dotenv module
import { EXPO_PUBLIC_API_URL } from '@env';

const BASE_URL = EXPO_PUBLIC_API_URL || 'https://api.doghealthapp.com';

class APIClient {
  private client: AxiosInstance;
  private static instance: APIClient;

  private constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      this.handleRequest,
      this.handleError
    );

    this.client.interceptors.response.use(
      this.handleResponse,
      this.handleError
    );
  }

  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  private handleRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Add auth token if available
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  };

  private handleResponse = (response: AxiosResponse): AxiosResponse => {
    return response;
  };

  private handleError = (error: AxiosError): Promise<never> => {
    const apiError: ApiError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.response?.data as Record<string, unknown>,
    };
    return Promise.reject(apiError);
  };

  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<T>(url, { params });
      return {
        data: response.data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data);
      return {
        data: response.data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data);
      return {
        data: response.data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data);
      return {
        data: response.data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<T>(url);
      return {
        data: response.data,
        error: null,
        status: response.status,
      };
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private normalizeError(error: unknown): ApiResponse<null> {
    if (error instanceof Error && 'isAxiosError' in error) {
      const axiosError = error as unknown as { isAxiosError: boolean; code?: string; message: string; response?: { data?: Record<string, unknown>; status?: number } };
      return {
        data: null,
        error: {
          code: axiosError.code || 'UNKNOWN_ERROR',
          message: axiosError.message,
          details: axiosError.response?.data,
        },
        status: axiosError.response?.status || 500,
      };
    }
    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      },
      status: 500,
    };
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.client.defaults.headers.common.Authorization;
  }
}

export const apiClient = APIClient.getInstance();
export default apiClient;