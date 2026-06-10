export async function requestSupabase<T>(input: string, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.headers || {}),
        },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
        const message = typeof json?.message === 'string'
            ? json.message
            : `Supabase request failed (${res.status})`;
        throw new Error(message);
    }

    return json?.data as T;
}