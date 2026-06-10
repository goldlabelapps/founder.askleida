'use client';
import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { 
    initClaude, 
    useClaude, 
    useLeidaBus,
    useDash,
 } from '../../../Leida';
import { setNXAdmin } from '../../../NXAdmin';

export default function Claude() {
    const dispatch = useDispatch();
    const claude = useClaude();
    const bus = useLeidaBus('/api/claude');
    const dash = useDash();

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Claude',
                icon: 'claude',
            }));
        }
    }, [dispatch, dash?.title]);

    React.useEffect(() => {
        if (!claude?.initted) {
            dispatch(initClaude());
        }
    }, [dispatch, claude?.initted]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
                {claude?.initted ? 'Claude is initialized.' : 'Connecting to the Claude API'}
            </Typography>
            <pre>{JSON.stringify(bus, null, 2)}</pre>
        </Box>
    );
}
