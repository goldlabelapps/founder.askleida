import { GET as getFeedProducts } from '../feed/route';

export async function GET(req: Request) {
  const url = new URL(req.url);
  // Force API mode for this endpoint to avoid feed-download behavior.
  url.searchParams.set('source', 'api');

  return getFeedProducts(
    new Request(url.toString(), {
      method: 'GET',
      headers: req.headers,
    })
  );
}
