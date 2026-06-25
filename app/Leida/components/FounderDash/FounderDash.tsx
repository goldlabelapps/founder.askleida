'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
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
    MightyButton,
    LeidaFlash,
} from '../../../Leida';

export default function FounderDash() {
    
    const dispatch = useDispatch();
    const router = useRouter();
    const leida = useLeida();
    const dash = useDash();
    const practitioners = usePractitioners();
    const didInit = React.useRef(false);
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!leida || !leida.dash) dispatch(initDash());
            didInit.current = true;
        }
    }, [dispatch, leida]);

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
            <MightyButton
                kind="listItem"
                icon="practitioner"
                onClick={() => dispatch(navigateTo(router, '/practitioners'))}
            >
                Create & mangage practitioners
            </MightyButton>

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
