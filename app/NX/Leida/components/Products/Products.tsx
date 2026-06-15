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
import { Icon } from '../../../DesignSystem';
import { setNXAdmin } from '../../../NXAdmin';
import { useLeida, awinCheckFeed, awinIngestFeed, awinSyncFeed } from '../../';

export default function Products() {
  const dispatch = useDispatch();
  const leida = useLeida();
  const pathname = usePathname();
  const uuid = pathname?.split('/').pop() ?? '';
  const isDetailRoute = !!uuid && uuid !== 'products' && uuid !== 'new';
  const feedCheck = leida?.products?.awinFeedCheck || {};
  const feedIngest = leida?.products?.awinFeedIngest || {};

  const handleAwinFeedCheck = React.useCallback(async () => {
    await dispatch(awinCheckFeed());
  }, [dispatch]);

  const handleAwinFeedIngest = React.useCallback(async () => {
    await dispatch(awinIngestFeed());
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

        <Button
          variant="contained"
          startIcon={<Icon icon="awin" />}
          onClick={() => dispatch(awinSyncFeed())}
          disabled={Boolean(feedCheck?.loading || feedIngest?.loading)}
          sx={{ mr: 1 }}
        >
          {feedCheck?.loading ? 'Checking feed...' : feedIngest?.loading ? 'Ingesting...' : 'Awin Feed'}
        </Button>


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
 
          {feedCheck?.error ? (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {feedCheck.error}
            </Typography>
          ) : null}

          {feedIngest?.error ? (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {feedIngest.error}
            </Typography>
          ) : null}

            <Paper variant="outlined" sx={{ 
              p: 2, 
              mb: 2, 
            }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Search UI for Awin products. 
                Search within all fields, order fields, pagination, 
                filters by tag or category
              </Typography>
              <pre>table: awin_lookfantastic</pre>

              {/* <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(feedCheck.response, null, 2)}
              </pre> */}

              

            </Paper>
        </Paper>
      </Grid>
    </Grid>
  );
}
