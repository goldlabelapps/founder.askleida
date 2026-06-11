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
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <AppBar
                    position="static"
                    color="transparent"
                    elevation={0}
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
                    }}
                >
                    <Toolbar sx={{ minHeight: '56px !important', px: 1.5, justifyContent: 'flex-end' }}>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                endIcon={<Icon icon="user" />}
                                onClick={handleGoToUsers}
                            >
                                Users
                            </Button>
                            <Button
                                variant="outlined"
                                endIcon={<Icon icon="right" />}
                                onClick={handleGoToPostgres}
                            >
                                Postgres tools
                            </Button>
                        </Stack>
                    </Toolbar>
                </AppBar>
            </Stack>
        </Box>
    );
}
