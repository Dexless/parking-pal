export interface HttpClientConfig {
  baseUrl: string;
}

export class HttpClient {
  private baseUrl: string;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
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

    const res = await fetch(url.toString());

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `GET ${url.pathname} failed: ${res.status} ${res.statusText} ${text}`
      );
    }

    return (await res.json()) as T;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `POST ${url.pathname} failed: ${res.status} ${res.statusText} ${text}`
      );
    }

    return (await res.json()) as T;
  }
}

export const apiClient = new HttpClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
});

export interface Lot {
  lot_id: number;
  lot_name: string;
  total_capacity: number;
  current: number;
  percent_full: number;
  state: string;
  type: string;
  hours: string;
}

export async function fetchLotData(lot_id: number) {
  return apiClient.get<Lot>(`/lots/${lot_id}`);
}

export async function randomizeData(lot_id: number) {
  return apiClient.post<Lot>(`/randomize_lot/${lot_id}`);
}

export async function fetchLotFullnessPercentages() {
  const lotStates = await apiClient.get<string[]>("/lots_percent_full");
  const lotStateByIndex: { [key: number]: string } = {};
  lotStates.forEach((percent, index) => {
    lotStateByIndex[index] = percent;
  });
  return lotStateByIndex;
}

export async function randomize_all_lot_events(
  lot_id: number,
  all_lots: boolean
) {
  return apiClient.post<null>(
    `/randomize_all_lot_events/${lot_id}/${all_lots}`
  );
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email?: string;
  };
}

export async function login(email: string, password: string) {
  return apiClient.post<LoginResponse>("/auth/login", { email, password });
}

export interface RegisterResponse {
  user?: {
    id?: string;
    email?: string;
  } | null;
  session?: {
    access_token?: string;
  } | null;
}

export async function register(email: string, password: string) {
  return apiClient.post<RegisterResponse>("/auth/register", { email, password });
}
