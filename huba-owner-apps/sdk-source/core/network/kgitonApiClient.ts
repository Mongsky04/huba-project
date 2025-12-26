import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiConstants } from '../constants/apiConstants';
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
 * Request options for API calls
 */
export interface RequestOptions {
  requiresAuth?: boolean;
  apiKey?: string;
  additionalHeaders?: Record<string, string>;
  timeout?: number;
}

/**
 * HTTP Client for KGiTON Core API
 *
 * Provides low-level HTTP methods for making API requests with:
 * - Automatic token management (access & refresh tokens)
 * - Request/response logging
 * - Error handling with custom exceptions
 * - Token persistence via AsyncStorage
 */
export class KgitonApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private defaultTimeout: number;
  private enableLogging: boolean;

  constructor(options: {
    baseUrl: string;
    accessToken?: string;
    refreshToken?: string;
    timeout?: number;
    enableLogging?: boolean;
  }) {
    this.baseUrl = options.baseUrl;
    this.accessToken = options.accessToken || null;
    this.refreshToken = options.refreshToken || null;
    this.defaultTimeout = options.timeout || 30000;
    this.enableLogging = options.enableLogging ?? __DEV__;
  }

  // ==================== Getters ====================

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  // ==================== Setters ====================

  setBaseUrl(url: string): void {
    this.baseUrl = url;
    this.log('Base URL updated:', url);
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
  }

  setTokens(options: {
    accessToken?: string | null;
    refreshToken?: string | null;
  }): void {
    if (options.accessToken !== undefined) {
      this.accessToken = options.accessToken;
    }
    if (options.refreshToken !== undefined) {
      this.refreshToken = options.refreshToken;
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  // ==================== Storage Operations ====================

  async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(ApiConstants.storageKeys.baseUrl, this.baseUrl);

      if (this.accessToken) {
        await AsyncStorage.setItem(
          ApiConstants.storageKeys.accessToken,
          this.accessToken
        );
      } else {
        await AsyncStorage.removeItem(ApiConstants.storageKeys.accessToken);
      }

      if (this.refreshToken) {
        await AsyncStorage.setItem(
          ApiConstants.storageKeys.refreshToken,
          this.refreshToken
        );
      } else {
        await AsyncStorage.removeItem(ApiConstants.storageKeys.refreshToken);
      }

      this.log('Configuration saved to local storage');
    } catch (error) {
      this.log('Error saving configuration:', error);
      throw error;
    }
  }

  async loadConfiguration(): Promise<void> {
    try {
      const baseUrl = await AsyncStorage.getItem(
        ApiConstants.storageKeys.baseUrl
      );
      const accessToken = await AsyncStorage.getItem(
        ApiConstants.storageKeys.accessToken
      );
      const refreshToken = await AsyncStorage.getItem(
        ApiConstants.storageKeys.refreshToken
      );

      if (baseUrl) this.baseUrl = baseUrl;
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      this.log('Configuration loaded from local storage');
    } catch (error) {
      this.log('Error loading configuration:', error);
      throw error;
    }
  }

  async clearConfiguration(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        ApiConstants.storageKeys.baseUrl,
        ApiConstants.storageKeys.accessToken,
        ApiConstants.storageKeys.refreshToken,
      ]);
      this.clearTokens();
      this.log('Configuration cleared from local storage');
    } catch (error) {
      this.log('Error clearing configuration:', error);
      throw error;
    }
  }

  // ==================== HTTP Methods ====================

  async get<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | undefined>,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint, queryParams);
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('POST', url, body, options);
  }

  async put<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('PUT', url, body, options);
  }

  async patch<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('PATCH', url, body, options);
  }

  async delete<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | undefined>,
    options?: RequestOptions
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

  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      [ApiConstants.headers.contentType]: ApiConstants.contentTypes.json,
    };

    if (options?.requiresAuth && this.accessToken) {
      headers[ApiConstants.headers.authorization] = `Bearer ${this.accessToken}`;
    }

    if (options?.apiKey) {
      headers[ApiConstants.headers.apiKey] = options.apiKey;
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
    options?: RequestOptions
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
      console.log('[KgitonApiClient]', ...args);
    }
  }
}
