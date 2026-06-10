import { NextResponse } from 'next/server';
import { makeRes } from '..';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropicModel = process.env.ANTHROPIC_MODEL?.trim() || '';

type T_AnthropicContentBlock = {
  type?: string;
  text?: string;
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

const getTextFromContent = (content: unknown): string => {
  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((block) => {
      if (!block || typeof block !== 'object') {
        return '';
      }
      const maybeText = (block as T_AnthropicContentBlock).text;
      return typeof maybeText === 'string' ? maybeText : '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();
};

export async function POST(req: Request) {
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

  let body: T_ClaudePromptBody;
  try {
    body = await req.json();
  } catch {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'Invalid JSON body',
    });
    return NextResponse.json(res, { status: 400 });
  }

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    const res = makeRes({
      tenant,
      severity: 'error',
      message: 'prompt is required',
    });
    return NextResponse.json(res, { status: 400 });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: anthropicModel,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

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
      return NextResponse.json(res, { status: anthropicRes.status });
    }

    const responseText = getTextFromContent(json?.content);
    const res = makeRes({
      tenant,
      severity: 'success',
      message: 'Claude response generated',
      data: {
        model: json?.model || anthropicModel,
        prompt,
        response: responseText,
        usage: json?.usage || null,
        id: json?.id,
      },
    });

    return NextResponse.json(res, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const res = makeRes({
      tenant,
      severity: 'error',
      message: `Claude lookup failed: ${message}`,
    });
    return NextResponse.json(res, { status: 500 });
  }
}