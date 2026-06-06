'use client';
import * as React from 'react';
import {
    Grid,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../NXAdmin';
import { usePaywall } from '../../../Paywall';
import { initProducts, setProducts, useProducts } from '../Products';
import { useDash } from '../MegaDash';
export default function Products() {
    
    const dispatch = useDispatch();
    const nxAdmin = useNXAdmin();
    const dash = useDash();
    const paywall = usePaywall();
    const products = useProducts();
    const user = paywall?.user ?? null;
    const didInit = React.useRef(false);
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!nxAdmin || !nxAdmin.products) dispatch(initProducts());
            didInit.current = true;
        }
    }, [dispatch, nxAdmin]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Products',
                icon: 'products',
            }));
        }
    }, [dispatch, dash?.title]);


    return (
        <>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    {/* <pre>{JSON.stringify(products, null, 2)}</pre> */}
                </Grid>
            </Grid>
        </>
    );
}