'use client';
import * as React from 'react';
import {
    Box,
    Button,
    Grid,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Icon, navigateTo } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import { setNXAdmin } from '../../../NX/NXAdmin';
import { useDash, DashCard } from '../../../Leida';

export default function Supabase() {
    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();

    React.useEffect(() => {
        dispatch(setNXAdmin('header', {
            title: 'Supabase',
            icon: 'supabase',
        }));
    }, [dispatch, dash?.title]);

    const handleCardClick = (route: string) => {
        dispatch(navigateTo(router, route));
    };

    return (<>

        <Grid container spacing={2} alignItems="stretch">
            <Grid size={{ xs: 12, md: 4 }}>
                <DashCard
                    title="Authentication"
                    icon={'supabase'}
                    cta={() => handleCardClick('/supabase/users')}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <DashCard
                    title="Postgres"
                    icon={'supabase'}
                    cta={() => handleCardClick('/supabase/postgres')}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <DashCard
                    title="Storage"
                    icon={'supabase'}
                    cta={() => handleCardClick('/supabase/storage')}
                />
            </Grid>
        </Grid>

    </>
    );
}
