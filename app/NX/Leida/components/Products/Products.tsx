'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Grid,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
// import AwinProductFinder from './components/AwinProductFinder';

export default function Products() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const uuid = pathname?.split('/').pop() ?? '';
  const isDetailRoute = !!uuid && uuid !== 'products' && uuid !== 'new';

  React.useEffect(() => {
    dispatch(setNXAdmin('header', {
      title: 'Products',
      icon: 'products',
    }));
  }, [dispatch]);

  if (isDetailRoute) return null;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>
        Awin affiliate table dsf
      </Grid>
      <Grid size={{ xs: 6 }}>
        Leida products
      </Grid>
    </Grid>
  );
  
}
