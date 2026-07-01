import { NextResponse } from 'next/server';
import { makeRes } from '..';
import { timingSafeEqual } from 'node:crypto';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropicModel = process.env.ANTHROPIC_MODEL?.trim() || '';

type T_RateLimitBucket = {
  count: number;
  resetAtMs: number;
};

type T_RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

type T_ClaudeRuntimeConfig = {
  authRequired: boolean;
  routeToken: string;
  maxPromptChars: number;
  timeoutMs: number;
  maxTokens: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
};

type T_AnthropicContentBlock = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

type T_AnthropicMessageResponse = {
  id?: string;
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  content?: T_AnthropicContentBlock[];
  error?: {
    message?: string;
  };
};

type T_ClaudePromptBody = {
  prompt?: string;
};

function readBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

function readIntegerEnv(value: string | undefined, fallback: number, min: number, max: number): number {
  if (typeof value !== 'string') {
    return fallback;
  }

  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function getRuntimeConfig(): T_ClaudeRuntimeConfig {
  return {
    authRequired: readBooleanEnv(process.env.CLAUDE_ROUTE_REQUIRE_AUTH, true),
    routeToken: process.env.CLAUDE_ROUTE_TOKEN?.trim() || '',
    maxPromptChars: readIntegerEnv(process.env.CLAUDE_MAX_PROMPT_CHARS, 8000, 256, 100000),
    timeoutMs: readIntegerEnv(process.env.CLAUDE_TIMEOUT_MS, 20000, 1000, 120000),
    maxTokens: readIntegerEnv(process.env.CLAUDE_MAX_TOKENS, 512, 1, 4096),
    rateLimitWindowMs: readIntegerEnv(process.env.CLAUDE_RATE_LIMIT_WINDOW_MS, 60000, 1000, 3600000),
    rateLimitMaxRequests: readIntegerEnv(process.env.CLAUDE_RATE_LIMIT_MAX, 20, 1, 10000),
  };
}

function getProvidedRouteToken(req: Request): string {
  const custom = req.headers.get('x-claude-token')?.trim();
  if (custom) {
    return custom;
  }

  const authorization = req.headers.get('authorization')?.trim() || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return authorization.slice(7).trim();
}

function tokensEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getClientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const value = forwarded || realIp || 'unknown';
  return value || 'unknown';
}

function getRateStore(): Map<string, T_RateLimitBucket> {
  const root = globalThis as typeof globalThis & {
    __claudeRateLimitBuckets?: Map<string, T_RateLimitBucket>;
  };

  if (!root.__claudeRateLimitBuckets) {
    root.__claudeRateLimitBuckets = new Map<string, T_RateLimitBucket>();
  }

  return root.__claudeRateLimitBuckets;
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): T_RateLimitResult {
  const now = Date.now();
  const store = getRateStore();
  const current = store.get(key);

  if (!current || current.resetAtMs <= now) {
    store.set(key, {
      count: 1,
      resetAtMs: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterSec: 0,
    };
  }

  current.count += 1;
  if (current.count <= maxRequests) {
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - current.count),
      retryAfterSec: 0,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    retryAfterSec: Math.max(1, Math.ceil((current.resetAtMs - now) / 1000)),
  };
}

function getTextFromContent(content: unknown): { text: string; contentTypes: string[] } {
  if (!Array.isArray(content)) {
    return { text: '', contentTypes: [] };
  }

  const contentTypes: string[] = [];
  const text = content
    .map((block) => {
      if (!block || typeof block !== 'object') {
        return '';
      }

      const typed = block as T_AnthropicContentBlock;
      const type = typeof typed.type === 'string' ? typed.type : 'unknown';
      if (!contentTypes.includes(type)) {
        contentTypes.push(type);
      }

      return typeof typed.text === 'string' ? typed.text : '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();

  return { text, contentTypes };
}

export async function POST(req: Request) {
  const config = getRuntimeConfig();

  if (!anthropicApiKey) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing ANTHROPIC_API_KEY environment variable',
    });
    return NextResponse.json(res, { status: 500 });
  }

  if (!anthropicModel) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing ANTHROPIC_MODEL environment variable',
    });
    return NextResponse.json(res, { status: 500 });
  }

  if (config.authRequired && !config.routeToken) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Missing CLAUDE_ROUTE_TOKEN environment variable while CLAUDE_ROUTE_REQUIRE_AUTH is enabled',
    });
    return NextResponse.json(res, { status: 500 });
  }

  if (config.authRequired) {
    const providedToken = getProvidedRouteToken(req);
    if (!providedToken || !tokensEqual(providedToken, config.routeToken)) {
      const res = makeRes({
        tenant,
        severity: 'error',
        message: 'Unauthorized',
      });
      return NextResponse.json(res, {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }
  }

  const rateKey = `claude:${getClientKey(req)}`;
  const rateLimit = checkRateLimit(rateKey, config.rateLimitMaxRequests, config.rateLimitWindowMs);
  const rateHeaders = {
    'Cache-Control': 'no-store',
    'X-RateLimit-Limit': String(config.rateLimitMaxRequests),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Window-Ms': String(config.rateLimitWindowMs),
  };

  if (!rateLimit.allowed) {
    const res = makeRes({
      tenant,
      severity: 'warning',
      message: `Rate limit exceeded. Retry in ${rateLimit.retryAfterSec}s.`,
    });
    return NextResponse.json(res, {
      status: 429,
      headers: {
        ...rateHeaders,
        'Retry-After': String(rateLimit.retryAfterSec),
      },
    });
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Content-Type must be application/json',
    });
    return NextResponse.json(res, {
      status: 415,
      headers: rateHeaders,
    });
  }

  let body: T_ClaudePromptBody;
  try {
    body = await req.json();
  } catch {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Invalid JSON body',
    });
    return NextResponse.json(res, {
      status: 400,
      headers: rateHeaders,
    });
  }

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'prompt is required',
    });
    return NextResponse.json(res, {
      status: 400,
      headers: rateHeaders,
    });
  }

  if (prompt.length > config.maxPromptChars) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: `prompt exceeds maximum length of ${config.maxPromptChars} characters`,
    });
    return NextResponse.json(res, {
      status: 413,
      headers: rateHeaders,
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs);

    let anthropicRes: Response;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: anthropicModel,
          max_tokens: config.maxTokens,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    let json: T_AnthropicMessageResponse | null = null;
    try {
      json = (await anthropicRes.json()) as T_AnthropicMessageResponse;
    } catch {
      json = null;
    }

    if (!anthropicRes.ok) {
      let message =
        json?.error?.message ||
        `Anthropic request failed (${anthropicRes.status})`;

      if (anthropicRes.status === 404) {
        message = `Anthropic model not found: ${anthropicModel}. Update ANTHROPIC_MODEL to a model available for your Anthropic account (for example: claude-haiku-4-5, claude-sonnet-4-6, claude-opus-4-8).`;
      }

      const res = makeRes({
        tenant,
        severity: 'error',
        message,
      });
      return NextResponse.json(res, {
        status: anthropicRes.status,
        headers: rateHeaders,
      });
    }

    const parsed = getTextFromContent(json?.content);
    const responseText = parsed.text;
    const isTextResponse = responseText.length > 0;
    const res = makeRes({
      tenant,
      severity: 'success',
      message: isTextResponse
        ? 'Claude response generated'
        : 'Claude response generated with non-text content blocks',
      data: {
        model: json?.model || anthropicModel,
        prompt,
        response: responseText,
        contentTypes: parsed.contentTypes,
        usage: json?.usage || null,
        id: json?.id,
      },
    });

    return NextResponse.json(res, {
      status: 200,
      headers: rateHeaders,
    });
  } catch (error: unknown) {
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const message = error instanceof Error ? error.message : String(error);
    const res = makeRes({
      tenant,
      severity: 'error',
      message: isTimeout
        ? `Claude lookup timed out after ${config.timeoutMs}ms`
        : `Claude lookup failed: ${message}`,
    });
    return NextResponse.json(res, {
      status: isTimeout ? 504 : 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}