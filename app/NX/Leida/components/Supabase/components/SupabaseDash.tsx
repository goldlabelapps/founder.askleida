'use client';
import * as React from 'react';
import {
    Box,
    Grid,
} from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../../NXAdmin';
import { 
    initDash, 
    useDash,
    README,
} from '../../../../Leida';

export default function SupabaseDash() {
    
    const dispatch = useDispatch();
    const nxAdmin = useNXAdmin();
    

    return (
        <>
            <Box sx={{ p: 2 }}>
                SupabaseDash
            </Box>
        </>
    );
}
