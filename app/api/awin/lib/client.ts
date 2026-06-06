const AWIN_API_BASE = 'https://api.awin.com';

type T_QueryValue = string | number | boolean | undefined | null;

type T_AwinFetchArgs = {
  path: string;
  query?: Record<string, T_QueryValue>;
  init?: RequestInit;
  includeAccessTokenQuery?: boolean;
};

export function getAwinConfig() {
  return {
    token: process.env.AWIN_OAUTH_TOKEN,
    publisherId: process.env.AWIN_PUBLISHER_ID,
    lookfantasticAdvertiserId: process.env.AWIN_LOOKFANTASTIC_ADVERTISER_ID,
  };
}

export function makeAwinUrl(path: string, query?: Record<string, T_QueryValue>) {
  const url = new URL(path, AWIN_API_BASE);

  if (!query) {
    return url;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  return url;
}

export async function awinFetch({
  path,
  query,
  init,
  includeAccessTokenQuery = true,
}: T_AwinFetchArgs) {
  const { token } = getAwinConfig();

  if (!token) {
    throw new Error('Missing AWIN_OAUTH_TOKEN');
  }

  const fullQuery = {
    ...query,
    ...(includeAccessTokenQuery ? { accessToken: token } : {}),
  };

  const url = makeAwinUrl(path, fullQuery);

  return fetch(url, {
    ...init,
    headers: {
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
}

export async function parseAwinErrorBody(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}