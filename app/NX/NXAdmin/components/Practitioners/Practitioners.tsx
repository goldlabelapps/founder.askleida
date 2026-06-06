'use client';
import * as React from 'react';
import {
    Grid,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../NXAdmin';
import { usePaywall } from '../../../Paywall';
import { initPractitioners, setPractitioners, usePractitioners } from '../Practitioners';
import { useDash } from '../MegaDash';
export default function Practitioners() {
    
    const dispatch = useDispatch();
    const nxAdmin = useNXAdmin();
    const dash = useDash();
    const paywall = usePaywall();
    const practitioners = usePractitioners();
    const user = paywall?.user ?? null;
    const didInit = React.useRef(false);
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!nxAdmin || !nxAdmin.practitioners) dispatch(initPractitioners());
            didInit.current = true;
        }
    }, [dispatch, nxAdmin]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Practitioners',
                icon: 'visitor',
            }));
        }
    }, [dispatch, dash?.title]);


    return (
        <>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <pre>{JSON.stringify(practitioners, null, 2)}</pre>
                </Grid>
            </Grid>
        </>
    );
}