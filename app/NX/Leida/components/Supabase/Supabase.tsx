'use client';
import * as React from 'react';
import {
    Grid,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../NXAdmin';
import { 
    initDash, 
    useDash,
    README,
    SupabaseDash,
} from '../../../Leida';


export default function Supabase() {
    
    const dispatch = useDispatch();
    const nxAdmin = useNXAdmin();
    const dash = useDash();
    

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Supabase',
                icon: 'supabase',
            }));
        }
    }, [dispatch, dash?.title]);

    return (
        <>
            Supabase
        </>
    );
}
