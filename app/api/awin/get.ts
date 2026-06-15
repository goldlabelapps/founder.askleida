import { NextResponse } from 'next/server';
import { getBaseurl, makeRes } from '..';

const tenant = process.env.NEXT_PUBLIC_TENANT;

export async function GET() {
  const baseURL = getBaseurl();
  const hasToken = Boolean(process.env.AWIN_OAUTH_TOKEN);
  const hasPublisherId = Boolean(process.env.AWIN_PUBLISHER_ID);

  const res = makeRes({
    tenant,
    severity: hasToken && hasPublisherId ? 'success' : 'warning',
    message:
      hasToken && hasPublisherId
        ? 'AWIN routes ready'
        : 'Missing AWIN env vars. Set AWIN_OAUTH_TOKEN and AWIN_PUBLISHER_ID.',
    data: {
      env: {
        hasToken,
        hasPublisherId,
        hasLookfantasticAdvertiserId: Boolean(process.env.AWIN_LOOKFANTASTIC_ADVERTISER_ID),
      },
      routes: {
        programmes: `${baseURL}/awin/programmes`,
        lookfantasticProducts: `${baseURL}/awin/lookfantastic/products`,
        lookfantasticFeed: `${baseURL}/awin/lookfantastic/feed`,
        lookfantasticSave: `${baseURL}/awin/lookfantastic/save`,
        lookfantasticSync: `${baseURL}/awin/lookfantastic/sync`,
        lookfantasticIngest: `${baseURL}/awin/lookfantastic/ingest`,
      },
    },
  });

  return NextResponse.json(res, { status: hasToken && hasPublisherId ? 200 : 500 });
}