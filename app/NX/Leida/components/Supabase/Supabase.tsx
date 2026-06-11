'use client';
import * as React from 'react';
import {
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Icon, navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import {
    useDash,
} from '../../../Leida';


export default function Supabase() {

    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Supabase',
                icon: 'supabase',
            }));
        }
    }, [dispatch, dash?.title]);

    const handleGoToPostgres = React.useCallback(() => {
        dispatch(navigateTo(router, '/supabase/postgres'));
    }, [dispatch, router]);

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="h6">Supabase module placeholder</Typography>
                        <Typography variant="body2" color="text.secondary">
                            This page is now a lightweight placeholder. The existing CRUD and table tools are available at /supabase/postgres.
                        </Typography>
                        <Box>
                            <Button
                                variant="contained"
                                endIcon={<Icon icon="right" />}
                                onClick={handleGoToPostgres}
                            >
                                Open Postgres tools
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
}
