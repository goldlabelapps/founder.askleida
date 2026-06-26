'use client';
import * as React from 'react';
import {
    Box,
    Stack,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import ListAwin from './components/ListAwin';
import AwinDetail from './components/AwinDetail';
import Query from './components/Query';
import {
    setLeida,
    setAwin,
    useAwin,
    useDash,
} from '../../../Leida';
import type { T_AwinProcessedPayload, T_AwinProduct } from '../../types';

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function asId(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '';
}

function productIdentity(product: T_AwinProduct | null | undefined): string {
    if (!product) {
        return '';
    }

    return asText(product.id)
        || asId(product.id)
        || asText(product.unique_key)
        || asText(product.aw_product_id)
        || asText(product.merchant_product_id);
}

export default function Awin() {
    const dispatch = useDispatch();
    const dash = useDash();
    const awin = useAwin();
    const products = Array.isArray(awin?.products) ? awin.products : [];
    const query = typeof awin?.query?.q === 'string' ? awin.query.q : '';
    const [selectedAwin, setSelectedAwin] = React.useState<T_AwinProduct | null>(null);

    const handleProcessed = React.useCallback(async ({ decision, awin: processedAwin }: T_AwinProcessedPayload) => {
        if (decision !== 'delete') {
            return;
        }

        const currentProducts: T_AwinProduct[] = Array.isArray(awin?.products) ? awin.products : [];
        const targetId = productIdentity(processedAwin);
        if (!targetId) {
            return;
        }

        const nextProducts = currentProducts.filter((product) => productIdentity(product) !== targetId);

        await dispatch(setAwin('products', nextProducts));
        await dispatch(setAwin('rows', nextProducts));
        await dispatch(setAwin('count', Math.max(0, nextProducts.length)));
        await dispatch(setAwin('scanned', nextProducts.length));
    }, [dispatch, awin?.products]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setLeida('header', {
                title: 'Awin',
                icon: 'awin',
            }));
        }
    }, [dispatch, dash?.title]);

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={1}>
                <Query />
                <ListAwin
                    products={products}
                    query={query}
                    onSelect={(product) => setSelectedAwin(product)}
                />
            </Stack>

            <AwinDetail
                open={Boolean(selectedAwin)}
                awin={selectedAwin}
                onClose={() => setSelectedAwin(null)}
                onProcessed={handleProcessed}
            />
        </Box>
    );
}