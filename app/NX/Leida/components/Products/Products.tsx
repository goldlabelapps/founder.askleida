'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import {
  Button,
  Chip,
  Paper,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import { useLeida, awinCheckFeed } from '../../';

export default function Products() {
  const dispatch = useDispatch();
  const leida = useLeida();
  const pathname = usePathname();
  const uuid = pathname?.split('/').pop() ?? '';
  const isDetailRoute = !!uuid && uuid !== 'products' && uuid !== 'new';
  const feedCheck = leida?.products?.awinFeedCheck || {};

  const handleAwinFeedCheck = React.useCallback(async () => {
    await dispatch(awinCheckFeed());
  }, [dispatch]);

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
          <Stack direction="row" spacing={1.5} sx={{ mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleAwinFeedCheck}
              disabled={Boolean(feedCheck?.loading)}
            >
              {feedCheck?.loading ? 'Checking Feed...' : 'Check AWIN Feed Changes'}
            </Button>

            {feedCheck?.lastCheckedAt ? (
              <Chip
                size="small"
                label={`Last checked: ${new Date(feedCheck.lastCheckedAt).toLocaleString()}`}
              />
            ) : null}

            {typeof feedCheck?.response?.changed === 'boolean' ? (
              <Chip
                color={feedCheck.response.changed ? 'warning' : 'success'}
                size="small"
                label={feedCheck.response.changed ? 'Feed changed' : 'No feed change'}
              />
            ) : null}
          </Stack>

          {feedCheck?.error ? (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {feedCheck.error}
            </Typography>
          ) : null}

          {/* {feedCheck?.response ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                AWIN Feed Check Response
              </Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(feedCheck.response, null, 2)}
              </pre>
            </Paper>
          ) : null} */}

          <ul>
            <li>Node script runs through the latest CSV file, updating products as needed</li>
            <li>Search UI for Awin products. Search within all fields, order fields, pagination, filters by tag or category</li>
            <li>Build a processing interface to turn an Awin lookfantasic products into Leida products. This is where Claude gets used</li>
            <li>Mirror this functionality in both founder & app</li>
          </ul>
        </Paper>
      </Grid>
    </Grid>
  );
}
