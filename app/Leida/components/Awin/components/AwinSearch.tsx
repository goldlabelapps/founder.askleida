'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { setNXAdmin } from '../../../../NX/NXAdmin';
import {
    setAwin,
    useDash,
    useAwin,
    useLeidaBus,
} from '../../../../Leida';
import { usePaywall } from '../../../../NX/Paywall';

type T_AwinProduct = {
    id?: string;
    title?: string;
    description?: string;
    category_name?: string;
    search_price?: number | string;
    aw_deep_link?: string;
    product_basic?: {
        id?: string;
        title?: string;
        description?: string;
        brand?: string;
    };
    [key: string]: any;
};

function getText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function inferProductName(product: T_AwinProduct): string {
    return getText(product?.title)
        || getText(product?.product_basic?.title)
        || getText(product?.product_basic?.id)
        || getText(product?.id)
        || 'Untitled product';
}

function inferProductDescription(product: T_AwinProduct): string {
    return getText(product?.description)
        || getText(product?.product_basic?.description)
        || '';
}

function inferProductPrice(product: T_AwinProduct): string {
    const value = product?.search_price;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }
    return '';
}

export default function AwinSearch() {
    const dispatch = useDispatch();
    const dash = useDash();
    const awin = useAwin();
    const paywall = usePaywall();
    const bus = useLeidaBus('/api/awin');

    const [query, setQuery] = React.useState('');
    const [limit, setLimit] = React.useState('20');
    const [advertiserId, setAdvertiserId] = React.useState('');
    const [locale, setLocale] = React.useState('en_GB');
    const [vertical, setVertical] = React.useState('retail');
    const [practitionerId, setPractitionerId] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [savingProductId, setSavingProductId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

    const products = (Array.isArray(awin?.products) ? awin.products : []) as T_AwinProduct[];
    const scanned = typeof awin?.scanned === 'number' ? awin.scanned : 0;
    const count = typeof awin?.count === 'number' ? awin.count : products.length;

    React.useEffect(() => {
        const uid = getText(paywall?.uid) || getText(paywall?.user?.uid);
        if (uid && !practitionerId) {
            setPractitionerId(uid);
        }
    }, [paywall?.uid, paywall?.user?.uid, practitionerId]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Awin',
                icon: 'awin',
            }));
        }
    }, [dispatch, dash?.title]);

    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSaveMessage(null);
        setLoading(true);

        try {
            const params = new URLSearchParams();
            if (query.trim()) params.set('q', query.trim());
            if (advertiserId.trim()) params.set('advertiserId', advertiserId.trim());
            if (locale.trim()) params.set('locale', locale.trim());
            if (vertical.trim()) params.set('vertical', vertical.trim());

            const parsedLimit = Number(limit);
            if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
                params.set('limit', String(Math.min(Math.floor(parsedLimit), 100)));
            }

            const res = await fetch(`/api/awin/lookfantastic/products?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                const detail = getText(json?.data?.hint)
                    || getText(json?.data?.upstream?.description)
                    || getText(json?.data?.description)
                    || getText(json?.error?.description);
                const message = getText(json?.message) || `Search failed (${res.status})`;
                throw new Error(detail ? `${message}: ${detail}` : message);
            }

            const payload = json?.data || {};
            const nextProducts = Array.isArray(payload?.products) ? payload.products : [];

            dispatch(setAwin('products', nextProducts));
            dispatch(setAwin('count', typeof payload?.count === 'number' ? payload.count : nextProducts.length));
            dispatch(setAwin('scanned', typeof payload?.scanned === 'number' ? payload.scanned : 0));
            dispatch(setAwin('lastQuery', query.trim()));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (product: T_AwinProduct) => {
        setError(null);
        setSaveMessage(null);

        const pid = practitionerId.trim();
        if (!pid) {
            setError('Practitioner ID is required before saving');
            return;
        }

        const key = getText(product?.id) || inferProductName(product);
        setSavingProductId(key);

        try {
            const res = await fetch('/api/awin/lookfantastic/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    practitioner_id: pid,
                    name: inferProductName(product),
                    description: inferProductDescription(product),
                    price: inferProductPrice(product),
                    category: getText(product?.category_name),
                    awinProduct: product,
                }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                const detail = getText(json?.data?.description)
                    || getText(json?.error?.description)
                    || getText(json?.hint);
                const message = getText(json?.message) || `Save failed (${res.status})`;
                throw new Error(detail ? `${message}: ${detail}` : message);
            }

            setSaveMessage(`Saved ${inferProductName(product)}`);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg || 'Save failed');
        } finally {
            setSavingProductId(null);
        }
    };

    return (
        <Box sx={{ p: 2, maxWidth: 1200 }}>
            <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                    {awin?.initted ? 'Awin is initialized.' : 'Connecting to the Awin API'}
                </Typography>

                <Paper component="form" onSubmit={handleSearch} sx={{ p: 2 }}>
                    <Stack spacing={2}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Search Lookfantastic products"
                                    placeholder="e.g. Medik8"
                                    fullWidth
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    disabled={loading}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                                <TextField
                                    label="Limit"
                                    type="number"
                                    fullWidth
                                    value={limit}
                                    onChange={(event) => setLimit(event.target.value)}
                                    disabled={loading}
                                    inputProps={{ min: 1, max: 100 }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <TextField
                                    label="Advertiser ID"
                                    fullWidth
                                    value={advertiserId}
                                    onChange={(event) => setAdvertiserId(event.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <TextField
                                    label="Locale"
                                    fullWidth
                                    value={locale}
                                    onChange={(event) => setLocale(event.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                <TextField
                                    label="Vertical"
                                    fullWidth
                                    value={vertical}
                                    onChange={(event) => setVertical(event.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <TextField
                                    label="Practitioner ID"
                                    fullWidth
                                    value={practitionerId}
                                    onChange={(event) => setPractitionerId(event.target.value)}
                                    helperText="Defaults to signed-in user uid"
                                />
                            </Grid>
                        </Grid>
                        <Box>
                            <Button type="submit" variant="contained" disabled={loading}>
                                {loading ? 'Searching...' : 'Search Feed'}
                            </Button>
                        </Box>
                    </Stack>
                </Paper>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {saveMessage ? <Alert severity="success">{saveMessage}</Alert> : null}

                <Stack direction="row" spacing={1}>
                    <Chip label={`${count} matches`} variant="outlined" />
                    <Chip label={`${scanned} rows scanned`} variant="outlined" />
                </Stack>

                <Grid container spacing={2}>
                    {products.map((product, index) => {
                        const id = getText(product?.id) || `${index}`;
                        const name = inferProductName(product);
                        const description = inferProductDescription(product);
                        const price = inferProductPrice(product);
                        const deepLink = getText(product?.aw_deep_link);

                        return (
                            <Grid key={id} size={{ xs: 12, md: 6 }}>
                                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                                    <Stack spacing={1.25}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                            {name}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            {price ? <Chip size="small" label={`GBP ${price}`} /> : null}
                                            {getText(product?.category_name) ? (
                                                <Chip size="small" variant="outlined" label={getText(product?.category_name)} />
                                            ) : null}
                                        </Stack>
                                        {description ? (
                                            <Typography variant="body2" color="text.secondary">
                                                {description}
                                            </Typography>
                                        ) : null}
                                        {deepLink ? (
                                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                                {deepLink}
                                            </Typography>
                                        ) : null}
                                        <Box>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleSave(product)}
                                                disabled={savingProductId === id}
                                            >
                                                {savingProductId === id ? 'Saving...' : 'Save to products'}
                                            </Button>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>

                <Typography variant="caption" color="text.secondary">
                    Bus status: {JSON.stringify(bus)}
                </Typography>
            </Stack>
        </Box>
    );
}
