'use client';
import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { initClaude, useClaude, useLeidaBus } from '../../../Leida';

export default function Claude() {
    const dispatch = useDispatch();
    const claude = useClaude();
    const bus = useLeidaBus('/api/claude');

    React.useEffect(() => {
        if (!claude?.initted) {
            dispatch(initClaude());
        }
    }, [dispatch, claude?.initted]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                Claude
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {claude?.initted ? 'Claude is initialized.' : 'Connecting to the Claude API'}
            </Typography>
            <pre>{JSON.stringify(bus, null, 2)}</pre>
        </Box>
    );
}
