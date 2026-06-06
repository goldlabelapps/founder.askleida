import { NextResponse } from 'next/server';
import { makeRes } from '../';

const tenant = process.env.NEXT_PUBLIC_TENANT;
const productsApiKey = process.env.PRODUCTS_API_KEY;

const getBearerToken = (req: Request): string | null => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    if (!scheme || !token) return null;
    return scheme.toLowerCase() === 'bearer' ? token.trim() : null;
};

export const mapSupabaseErrorStatus = (code?: string): number => {
    if (code === 'PGRST116') return 404;
    return 500;
};

export const requireProductsApiKey = (req: Request): NextResponse | null => {
    if (!productsApiKey) {
        const res = makeRes({
            tenant,
            message: 'Missing server configuration: PRODUCTS_API_KEY',
            severity: 'error',
        });
        return NextResponse.json(res, { status: 500 });
    }

    const providedKey = req.headers.get('x-api-key') || getBearerToken(req);
    if (!providedKey || providedKey !== productsApiKey) {
        const res = makeRes({
            tenant,
            message: 'Unauthorized',
            severity: 'error',
        });
        return NextResponse.json(res, { status: 401 });
    }

    return null;
};