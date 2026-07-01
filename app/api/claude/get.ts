import { NextResponse } from 'next/server';
import { getBaseurl, makeRes } from '..';

const tenant = process.env.NEXT_PUBLIC_TENANT;

function readBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

export async function GET() {
  const baseURL = getBaseurl();
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const model = process.env.ANTHROPIC_MODEL?.trim() || null;
  const hasModel = Boolean(model);
  const authRequired = readBooleanEnv(process.env.CLAUDE_ROUTE_REQUIRE_AUTH, true);
  const hasRouteToken = Boolean(process.env.CLAUDE_ROUTE_TOKEN?.trim());
  const exposeModel = readBooleanEnv(process.env.CLAUDE_EXPOSE_MODEL, false);

  const missing: string[] = [];
  if (!hasApiKey) missing.push('ANTHROPIC_API_KEY');
  if (!hasModel) missing.push('ANTHROPIC_MODEL');
  if (authRequired && !hasRouteToken) missing.push('CLAUDE_ROUTE_TOKEN');
  const isReady = missing.length === 0;

  const res = makeRes({
    tenant,
    severity: isReady ? 'success' : 'warning',
    message: isReady
      ? 'Claude routes ready'
      : `Claude route not ready. Missing env vars: ${missing.join(', ')}.`,
    data: {
      env: {
        hasApiKey,
        hasModel,
        authRequired,
        hasRouteToken,
        model: exposeModel ? model : null,
      },
      routes: {
        claude: `${baseURL}/claude`,
      },
      methods: ['GET', 'POST'],
    },
  });

  return NextResponse.json(res, {
    status: isReady ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
