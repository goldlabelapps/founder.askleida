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
    fetchLeida,
    setLeida,
    useLeida,
    initDash, 
    useDash,
    useLeidaBus,
    SurfacePractitioners,
    MightyButton,
    PractitionerList,
} from '../../../Leida';

export default function FounderDash() {
    
    const dispatch = useDispatch();
    const router = useRouter();
    const leida = useLeida();
    const dash = useDash();
    const { data: practitionersData, loading: practitionersLoading } = useLeidaBus('/api/practitioners');
    const didInit = React.useRef(false);
    const practitionersRouteEntry = leida?.bus?.['/api/practitioners'];
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!leida || !leida.dash) dispatch(initDash());
            if (!practitionersRouteEntry) {
                dispatch(fetchLeida('/api/practitioners'));
            }
            didInit.current = true;
        }
    }, [dispatch, leida, practitionersRouteEntry]);

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
