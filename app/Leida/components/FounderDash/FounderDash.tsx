'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    ButtonBase,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { Icon, navigateTo } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import { 
    setLeida,
    useLeida,
    initDash, 
    initPractitioners, 
    useDash,
    usePractitioners,
    AffiliatePlayer,
    ListProducts,
} from '../../../Leida';

export default function FounderDash() {
    
    const dispatch = useDispatch();
    const router = useRouter();
    const leida = useLeida();
    const dash = useDash();
    const practitioners = usePractitioners();
    const didInit = React.useRef(false);

    const numberOfPractitioners = Array.isArray(practitioners?.list) ? practitioners.list.length : 0;

    const dashboardActions = [    
        
        {
            title: 'Products',
            description: 'Browse/manage Leida products & add from Awin',
            icon: 'products',
            route: '/products',
        },
        
    ] as const;
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!leida || !leida.dash) dispatch(initDash());
            didInit.current = true;
        }
    }, [dispatch, leida]);

    React.useEffect(() => {
        if (typeof practitioners === 'undefined') {
            dispatch(initPractitioners());
        }
    }, [dispatch, practitioners]);

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
            Dash
        </Box>
    );
}

/*

*/