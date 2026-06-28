'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
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
        <Box>
            <SurfacePractitioners
                practitioners={Array.isArray(practitionersData) ? practitionersData : []}
                loading={practitionersLoading}
            />

            <MightyButton
                kind="listItem"
                icon="products"
                onClick={() => dispatch(navigateTo(router, '/products'))}
            >
                Browse & manage Leida products & add from Awin
            </MightyButton>
        </Box>
    );
}
