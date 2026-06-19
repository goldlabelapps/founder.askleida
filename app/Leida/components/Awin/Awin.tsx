'use client';
import * as React from 'react';
import {
    Box,
    Stack,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { setNXAdmin } from '../../../NX/NXAdmin';
import ListAwin from './components/ListAwin';
import AwinDetail from './components/AwinDetail';
import Query from './components/Query';
import {
    useAwin,
    useDash,
} from '../../../Leida';
import type { T_AwinProduct } from '../../types';

export default function Awin() {
    const dispatch = useDispatch();
    const dash = useDash();
    const awin = useAwin();
    const products = Array.isArray(awin?.products) ? awin.products : [];
    const query = typeof awin?.query?.q === 'string' ? awin.query.q : '';
    const [selectedAwin, setSelectedAwin] = React.useState<T_AwinProduct | null>(null);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
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
            />
        </Box>
    );
}