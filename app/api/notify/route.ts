import { NextRequest, NextResponse } from 'next/server';
import { makeRes } from '../lib/makeRes';

export interface I_NotifyBody {
    tokens: string[];
    title: string;
    body?: string;
    icon?: string;
    url?: string;
    data?: Record<string, string>;
}

/**
 * POST /api/notify
 * Push notifications are currently disabled.
 */
export async function POST(req: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const secret = process.env.NOTIFY_SECRET;
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!secret || token !== secret) {
        return NextResponse.json(
            makeRes({ severity: 'error', message: 'Unauthorized' }),
            { status: 401 },
        );
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let body: I_NotifyBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            makeRes({ severity: 'error', message: 'Invalid JSON body' }),
            { status: 400 },
        );
    }

    const { tokens, title, body: notifBody = '', icon, url, data } = body;

    if (!Array.isArray(tokens) || tokens.length === 0) {
        return NextResponse.json(
            makeRes({ severity: 'error', message: '`tokens` must be a non-empty array' }),
            { status: 400 },
        );
    }

    if (!title) {
        return NextResponse.json(
            makeRes({ severity: 'error', message: '`title` is required' }),
            { status: 400 },
        );
    }

    void notifBody;
    void icon;
    void url;
    void data;
    return NextResponse.json(
        makeRes({
            severity: 'warning',
            message: 'Push notifications are disabled. No provider is configured.',
        }),
        { status: 501 },
    );
}
