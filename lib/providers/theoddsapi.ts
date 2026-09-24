export type OddsProviderSport = {
  key: string;
  group?: string;
  title?: string;
  description?: string;
  active?: boolean;
  min_tier?: string;
  has_outrights?: boolean;
};

export type OddsOutcome = {
  name: string;
  price: number;
  point?: number | null;
  description?: string | null;
};

export type OddsMarket = {
  key: string;
  last_update?: string;
  outcomes?: OddsOutcome[];
};

export type OddsBookmaker = {
  key: string;
  title?: string;
  last_update?: string;
  markets?: OddsMarket[];
};

export type OddsEvent = {
  id: string;
  sport_key?: string;
  sport_title?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsBookmaker[];
};

const BASE = "https://api.theoddsapi.com";

function key() {
  const value = process.env.THE_ODDS_API_KEY;
  if (!value) throw new Error("THE_ODDS_API_KEY is not configured");
  return value;
}

async function request<T>(path: string, params: Record<string, string> = {}) {
  const url = new URL(path, BASE);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url, {
    headers: {
      "x-api-key": key(),
      accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: unknown }).message)
        : response.statusText;
    throw new Error(`The Odds API ${response.status}: ${detail}`);
  }

  return body as T;
}

export async function listSports() {
  const body = await request<OddsProviderSport[]>("/sports/");
  return Array.isArray(body) ? body : [];
}

export async function listOdds(sportKey: string, from: string, to: string) {
  return request<OddsEvent[]>("/odds/", {
    sport_key: sportKey,
    markets: "h2h,spreads,totals",
    oddsFormat: "decimal",
    commenceTimeFrom: from,
    commenceTimeTo: to,
  });
}
