/**
 * Fetcher utility for API calls
 */
type RequestOptions = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

type RequestWithBodyOptions = RequestOptions & {
  body?: any;
};

class Fetcher {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    url: string,
    options: RequestWithBodyOptions = {}
  ): Promise<T> {
    const { body, headers = {}, signal } = options;
    const requestUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;
    
    const response = await fetch(requestUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
      Object.assign(error, { status: response.status, data: errorData });
      throw error;
    }

    // For DELETE requests that return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', url, options);
  }

  post<T>(url: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', url, { ...options, body });
  }

  put<T>(url: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', url, { ...options, body });
  }

  patch<T>(url: string, body: any, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', url, { ...options, body });
  }

  delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', url, options);
  }
}

export const fetcher = new Fetcher();
