'use client';
import * as React from 'react';
import {
    Box,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { setNXAdmin } from '../../../NX/NXAdmin';
import {
    useAwin,
    useDash,
} from '../../../Leida';

export default function Awin() {
    const dispatch = useDispatch();
    const dash = useDash();
    const awin = useAwin();

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
            <Stack spacing={1.5}>
                <Typography variant="h6">Awin</Typography>
                <Typography variant="body2" color="text.secondary">
                    Redux key: leida.awin
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, overflowX: 'auto' }}>
                    <Box
                        component="pre"
                        sx={{
                            m: 0,
                            fontSize: 12,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    >
                        {JSON.stringify(awin ?? null, null, 2)}
                    </Box>
                </Paper>
            </Stack>
        </Box>
    );
}