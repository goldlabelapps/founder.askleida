'use client';
import * as React from 'react';
import {
    AppBar,
    Box,
    Button,
    Paper,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Icon, navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import {
    useDash,
} from '../../../Leida';

export default function Awin() {
    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Awin',
                icon: 'awin',
            }));
        }
    }, [dispatch, dash?.title]);

    const handleGoToSearch = React.useCallback(() => {
        dispatch(navigateTo(router, '/awin/search'));
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
                        <Button
                            variant="outlined"
                            endIcon={<Icon icon="search" />}
                            onClick={handleGoToSearch}
                        >
                            Search
                        </Button>
                    </Toolbar>
                </AppBar>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="h6">Awin module</Typography>
                        <Typography variant="body2" color="text.secondary">
                            AWIN tools are now grouped under subpages. Use Search to query Lookfantastic products and save into products.
                        </Typography>
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
}
