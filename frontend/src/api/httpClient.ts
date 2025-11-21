// frontend/src/api/httpClient.ts

export interface HttpClientConfig {
  baseUrl: string;
}

export class HttpClient {
  private baseUrl: string;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, ""); // strip trailing slash
  }

  async get<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
      
    console.log("[HttpClient] GET", url.toString());


    const res = await fetch(url.toString());

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `GET ${url.pathname} failed: ${res.status} ${res.statusText} ${text}`
      );
    }

    return (await res.json()) as T;
  }
}

// Singleton instance you can import anywhere
export const apiClient = new HttpClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
});
