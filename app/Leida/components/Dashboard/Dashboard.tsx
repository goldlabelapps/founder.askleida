'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
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
    SurfacePractitioners,
    MightyButton,
    PractitionerList,
} from '../../../Leida';

export default function Dashboard() {
    
    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();
    
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

    return (
        <Grid container spacing={2} sx={{ mt: 1 }}>
            

            <Grid size={{
                xs: 12,
                sm: 6,
                lg: 4,
            }}>
                <Typography variant="overline">
                    Practitioners
                </Typography>
                <PractitionerList />
            </Grid>

            <Grid size={{
                xs: 12,
                sm: 6,
                lg: 4,
            }}>
                <Typography variant="overline">
                    Products
                </Typography>
                <Box>

                    <MightyButton
                        kind="button"
                        fullWidth
                        alignLeft
                        variant="outlined"
                        startIcon="awin"
                        onClick={() => dispatch(navigateTo(router, '/products/awin'))}
                        >
                        AWIN
                    </MightyButton>
                </Box>
            </Grid>
            

            
        </Grid>
    );
}
