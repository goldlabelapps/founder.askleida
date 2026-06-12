'use client';
import * as React from 'react';
import {
    AppBar,
    Box,
    Button,
    Stack,
    Toolbar,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Icon, navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import { useDash } from '../../../Leida';

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

    const handleGoToUsers = React.useCallback(() => {
        dispatch(navigateTo(router, '/supabase/users'));
    }, [dispatch, router]);

    const handleGoToPostgres = React.useCallback(() => {
        dispatch(navigateTo(router, '/supabase/postgres'));
    }, [dispatch, router]);

    return (
        <Box sx={{ p: 2 }} gap={2} display="flex" flexDirection="column">
            <Button
                fullWidth
                variant="contained"
                endIcon={<Icon icon="right" />}
                onClick={handleGoToUsers}
            >
                Users
            </Button>
            <Button
                fullWidth
                variant="contained"
                endIcon={<Icon icon="right" />}
                onClick={handleGoToPostgres}
            >
                Postgres
            </Button>
        </Box>
    );
}
