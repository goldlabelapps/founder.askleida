'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Badge,
    Box,
    Grid,
    Typography,
} from '@mui/material';
import { navigateTo } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import { 
    setLeida,
    initDash, 
    useDash,
    MightyButton,
    PractitionerList,
} from '../../../Leida';

export default function Dashboard() {
    
    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();
    const [queueTotal, setQueueTotal] = React.useState(0);
    
    React.useEffect(() => {
        dispatch(initDash());
    }, [dispatch]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setLeida('header', {
                title: 'Dashboard',
                icon: 'dashboard',
            }));
        }
    }, [dispatch, dash?.title]);

    React.useEffect(() => {
        const refreshQueueTotal = async () => {
            try {
                const params = new URLSearchParams({
                    page: '1',
                    pageSize: '1',
                    status: 'pending',
                });

                const res = await fetch(`/api/products/queue?${params.toString()}`, {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                });

                const json = await res.json().catch(() => null);
                if (!res.ok) {
                    setQueueTotal(0);
                    return;
                }

                setQueueTotal(typeof json?.data?.total === 'number' ? json.data.total : 0);
            } catch {
                setQueueTotal(0);
            }
        };

        const onQueueCountRefresh = () => {
            void refreshQueueTotal();
        };

        void refreshQueueTotal();

        const intervalId = window.setInterval(() => {
            void refreshQueueTotal();
        }, 15000);

        window.addEventListener('leida:queue-count-refresh', onQueueCountRefresh);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('leida:queue-count-refresh', onQueueCountRefresh);
        };
    }, []);

    return (
        <Grid container spacing={2} sx={{ mt: 1 }}>

            <Grid size={{
                xs: 12,
                sm: 6,
                lg: 4,
            }}>
                <Typography variant="overline">
                    Products
                </Typography>
                <Box sx={{ height: 24 }} />
                
                <MightyButton
                    alignLeft
                    variant="outlined"
                    startIcon="products"
                    onClick={() => {
                        dispatch(navigateTo(router, '/products'));
                    }}
                >
                    Manage
                </MightyButton>

                <Box sx={{ height: 24 }} />
                <Typography variant="body1">
                    Manage products. Maintain the AWIN data table,
                    add products to the Queue, process Queue item by item
                    using Claude
                </Typography>
                <Box sx={{ height: 24 }} />
                <Badge
                    color="primary"
                    badgeContent={queueTotal}
                    showZero
                    overlap="rectangular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    sx={{ width: '100%' }}
                >
                    <MightyButton
                        alignLeft
                        variant="outlined"
                        startIcon="queue"
                        onClick={() => {
                            dispatch(navigateTo(router, '/products/queue'));
                        }}
                    >
                        Queue
                    </MightyButton>
                </Badge>
                <Box sx={{ height: 24 }} />
                <MightyButton
                    variant="outlined"
                    startIcon="awin"
                    onClick={() => {
                    dispatch(navigateTo(router, '/products/awin'));
                    }}
                >
                    Add more
                </MightyButton>
            </Grid>
            
            <Grid size={{
                xs: 12,
                sm: 6,
                lg: 4,
            }}>
                <Typography variant="overline">
                    Practitioners
                </Typography>
                <Box sx={{ height: 24 }} />

                
                <MightyButton
                    fullWidth
                    alignLeft
                    kind="button"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                        dispatch(navigateTo(router, '/practitioners/new'));
                    }}
                    startIcon="practitioner-add"
                >
                    New Practitioner
                </MightyButton>
                
                <Box sx={{ height: 12 }} />
                <PractitionerList />
            </Grid>
            
        </Grid>
    );
}
