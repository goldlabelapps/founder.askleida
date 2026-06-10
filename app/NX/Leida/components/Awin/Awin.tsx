'use client';
import * as React from 'react';
import {
    Box,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import {
    initAwin,
    useDash,
    useAwin,
    useLeidaBus,
} from '../../../Leida';

export default function Awin() {
    
    const dispatch = useDispatch();
    const dash = useDash();
    const awin = useAwin();
    const bus = useLeidaBus('/api/awin');

    React.useEffect(() => {
        if (!awin?.initted) {
            dispatch(initAwin());
        }
    }, [dispatch, awin?.initted]);

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
           {awin?.initted ? 'Awin is initialized.' : 'Connecting to the Awin API'}
            <pre>{JSON.stringify(bus, null, 2)}</pre>
        </Box>
    );
}
