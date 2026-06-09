'use client';
import * as React from 'react';
import {
    Box,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import {
    useDash,
    useLeidaBus,
} from '../../../Leida';


export default function Awin() {
    
    const dispatch = useDispatch();
    const dash = useDash();

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Awin',
                icon: 'awin',
            }));
        }
    }, [dispatch, dash?.title]);

    return (
        <Box sx={{ p: 2 }}>
            AwinAwinA winAwinAwin
        </Box>
    );
}
