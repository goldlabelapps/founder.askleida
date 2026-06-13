'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Chip,
  Paper,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';

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
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid size={{
        xs: 12,
      }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(140deg, rgba(16,24,40,0.03), rgba(16,24,40,0.01))',
          }}
        >
          <Stack spacing={2}>
            <Chip label='Placeholder Clip' size='small' sx={{ width: 'fit-content' }} />
            <Typography variant='h5' fontWeight={700}>
              Planned Product Pipeline (Lookfantastic &rarr; Supabase &rarr; Leida)
            </Typography>
            <Typography color='text.secondary'>
              We are preparing to ingest Lookfantastic&apos;s 25k-row CSV into Postgres on Supabase,
              then expose fast product search from that source table.
            </Typography>
            <Typography color='text.secondary'>
              The source table will be refreshed by a cron job whenever feed changes are detected
              from Awin.
            </Typography>
            <Typography color='text.secondary'>
              Products will then be read from that table, reshaped into Leida product records,
              and tuned by AI (Claude) before being written into the `products` table.
            </Typography>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}
