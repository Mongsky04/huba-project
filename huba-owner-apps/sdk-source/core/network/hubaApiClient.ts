import AsyncStorage from '@react-native-async-storage/async-storage';
import { HubaApiConstants } from '../constants/hubaApiConstants';
import {
  ApiException,
  AuthenticationException,
  AuthorizationException,
  NetworkException,
  NotFoundException,
  ParseException,
  ServerException,
  TimeoutException,
  ValidationException,
} from '../exceptions/apiExceptions';

/**
 * Request options for Huba API calls
 */
export interface HubaRequestOptions {
  requiresAuth?: boolean;
  additionalHeaders?: Record<string, string>;
  timeout?: number;
}

/**
 * HTTP Client for Huba API
 *
 * Provides low-level HTTP methods for making API requests with:
 * - Automatic token management
 * - Request/response logging
 * - Error handling with custom exceptions
 */
export class HubaApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private defaultTimeout: number;
  private enableLogging: boolean;

  constructor(options?: {
    baseUrl?: string;
    accessToken?: string;
    timeout?: number;
    enableLogging?: boolean;
  }) {
    this.baseUrl = options?.baseUrl || HubaApiConstants.defaultBaseUrl;
    this.accessToken = options?.accessToken || null;
    this.defaultTimeout = options?.timeout || 30000;
    this.enableLogging = options?.enableLogging ?? __DEV__;
  }

  // ==================== Getters ====================

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // ==================== Setters ====================

  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.log('Base URL updated:', url);
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  // ==================== Storage Operations ====================

  async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        HubaApiConstants.storageKeys.hubaBaseUrl,
        this.baseUrl
      );
      this.log('Configuration saved to local storage');
    } catch (error) {
      this.log('Error saving configuration:', error);
      throw error;
    }
  }

  async loadConfiguration(): Promise<void> {
    try {
      const baseUrl = await AsyncStorage.getItem(
        HubaApiConstants.storageKeys.hubaBaseUrl
      );

      if (baseUrl) this.baseUrl = baseUrl;

      this.log('Configuration loaded from local storage');
    } catch (error) {
      this.log('Error loading configuration:', error);
      throw error;
    }
  }

  // ==================== HTTP Methods ====================

  async get<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | undefined>,
    options?: HubaRequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint, queryParams);
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: HubaRequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('POST', url, body, options);
  }

  async put<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: HubaRequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('PUT', url, body, options);
  }

  async patch<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: HubaRequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('PATCH', url, body, options);
  }

  async delete<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | undefined>,
    options?: HubaRequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint, queryParams);
    return this.request<T>('DELETE', url, undefined, options);
  }

  // ==================== Private Methods ====================

  private buildUrl(
    endpoint: string,
    queryParams?: Record<string, string | number | undefined>
  ): string {
    const url = new URL(endpoint, this.baseUrl);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private buildHeaders(options?: HubaRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      [HubaApiConstants.headers.contentType]: HubaApiConstants.contentTypes.json,
    };

    if (options?.requiresAuth && this.accessToken) {
      headers[HubaApiConstants.headers.authorization] = `Bearer ${this.accessToken}`;
    }

    if (options?.additionalHeaders) {
      Object.assign(headers, options.additionalHeaders);
    }

    return headers;
  }

  private async request<T>(
    method: string,
    url: string,
    body?: Record<string, unknown>,
    options?: HubaRequestOptions
  ): Promise<T> {
    const headers = this.buildHeaders(options);
    const timeout = options?.timeout || this.defaultTimeout;

    this.log(`Request [${method}] ${url}`, body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return this.handleResponse<T>(response, url);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutException(`Request timed out after ${timeout}ms`);
        }
        throw new NetworkException(error.message, error);
      }

      throw new NetworkException('An unknown network error occurred', error);
    }
  }

  private async handleResponse<T>(response: Response, endpoint: string): Promise<T> {
    const responseText = await response.text();
    this.log(`Response [${response.status}] ${endpoint}:`, responseText);

    // Handle successful responses
    if (response.ok) {
      if (!responseText) {
        return null as T;
      }
      try {
        return JSON.parse(responseText) as T;
      } catch (e) {
        throw new ParseException(`Failed to parse response: ${e}`, responseText);
      }
    }

    // Try to parse error message from response
    let errorMessage = 'Request failed';
    try {
      const errorBody = JSON.parse(responseText);
      errorMessage = errorBody.error || errorBody.message || errorMessage;
    } catch {
      errorMessage = `Request failed with status ${response.status}`;
    }

    // Throw appropriate exception based on status code
    switch (response.status) {
      case 400:
        throw new ValidationException(errorMessage, 400, responseText);
      case 401:
        throw new AuthenticationException(errorMessage, 401, responseText);
      case 403:
        throw new AuthorizationException(errorMessage, 403, responseText);
      case 404:
        throw new NotFoundException(errorMessage, 404, responseText);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerException(errorMessage, response.status, responseText);
      default:
        throw new ApiException(errorMessage, response.status, responseText);
    }
  }

  private log(...args: unknown[]): void {
    if (this.enableLogging) {
      console.log('[HubaApiClient]', ...args);
    }
  }
}
