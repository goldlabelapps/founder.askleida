'use client';
import * as React from 'react';
import moment from 'moment';
import {
  Alert,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { Icon } from '../../../../NX/DesignSystem';
import { awinIngestFeed } from '../actions/awinIngestFeed';
import { awinSyncFeed } from '../actions/awinSyncFeed';
import { fetchSupabaseRows } from '../../Supabase/actions/fetchSupabaseRows';
import { fetchSupabaseSchema } from '../../Supabase/actions/fetchSupabaseSchema';
import { initSupabase } from '../../Supabase/actions/initSupabase';
import { useSupabase } from '../../Supabase/hooks/useSupabase';

type T_TableCheckState = {
  severity: 'success' | 'warning' | 'error';
  message: string;
};

type T_AwinStatusResponse = {
  env?: {
    lookfantasticTable?: string;
  };
};

export default function AwinFeedMonitor() {
  const SNAPSHOT_TABLE = 'awin_feed_snapshots';
  const LOOKFANTASTIC_TABLE = 'awin_lookfantastic';
  const dispatch = useDispatch();
  const supabase = useSupabase();
  const [tableCheckLoading, setTableCheckLoading] = React.useState(false);
  const [ingestLoading, setIngestLoading] = React.useState(false);
  const [tableCheckResult, setTableCheckResult] = React.useState<T_TableCheckState | null>(null);

  const snapshotState = supabase?.rowsByTable?.[SNAPSHOT_TABLE] || {};
  const snapshotRows = Array.isArray(snapshotState?.rows) ? snapshotState.rows : [];
  const snapshotLoading = Boolean(snapshotState?.loading);

  const lookfantasticState = supabase?.rowsByTable?.[LOOKFANTASTIC_TABLE] || {};
  const lookfantasticRows = Array.isArray(lookfantasticState?.rows) ? lookfantasticState.rows : [];
  const lookfantasticCount = typeof lookfantasticState?.count === 'number' ? lookfantasticState.count : 0;
  const lookfantasticOffset = typeof lookfantasticState?.offset === 'number' ? lookfantasticState.offset : 0;
  const lookfantasticLoading = Boolean(lookfantasticState?.loading);
  const lookfantasticLastCreated = lookfantasticRows[0]?.created_at || null;

  React.useEffect(() => {
    dispatch(initSupabase());
    dispatch(fetchSupabaseRows({ table: SNAPSHOT_TABLE, limit: 25, offset: 0 }));
    dispatch(fetchSupabaseRows({ table: LOOKFANTASTIC_TABLE, limit: 1, offset: 0 }));
  }, [dispatch]);

  React.useEffect(() => {
    if (lookfantasticLoading) {
      return;
    }

    if (lookfantasticCount <= 0) {
      return;
    }

    const latestOffset = Math.max(lookfantasticCount - 1, 0);
    if (lookfantasticOffset === latestOffset) {
      return;
    }

    dispatch(fetchSupabaseRows({ table: LOOKFANTASTIC_TABLE, limit: 1, offset: latestOffset }));
  }, [dispatch, lookfantasticCount, lookfantasticLoading, lookfantasticOffset]);

  const handleRefreshSnapshots = React.useCallback(async () => {
    await dispatch(fetchSupabaseRows({ table: SNAPSHOT_TABLE, limit: 25, offset: 0 }));
    await dispatch(fetchSupabaseRows({ table: LOOKFANTASTIC_TABLE, limit: 1, offset: 0 }));
  }, [dispatch]);

  const handleCheckSupabaseTable = React.useCallback(async () => {
    setTableCheckLoading(true);
    setTableCheckResult(null);

    try {
      await dispatch(initSupabase());
      const awinResponse = await fetch('/api/awin', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      const awinJson = await awinResponse.json().catch(() => null);

      if (!awinResponse.ok) {
        const message = typeof awinJson?.message === 'string'
          ? awinJson.message
          : `AWIN status request failed (${awinResponse.status})`;
        throw new Error(message);
      }

      const awinData = (awinJson?.data ?? null) as T_AwinStatusResponse | null;
      const tableName = awinData?.env?.lookfantasticTable?.trim() || LOOKFANTASTIC_TABLE;
      const schema = await dispatch(fetchSupabaseSchema());
      const tables = Array.isArray(schema?.tables) ? schema.tables : [];
      const tableExists = tables.some((table: { table_name?: string }) => table?.table_name === tableName);

      if (!tableExists) {
        setTableCheckResult({
          severity: 'warning',
          message: `Supabase table "${tableName}" was not found. It may not have been created yet; the Lookfantastic ingest flow can create it when it runs.`,
        });
        return;
      }

      setTableCheckResult({
        severity: 'success',
        message: `Supabase table "${tableName}" exists and is ready for Lookfantastic data.`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTableCheckResult({
        severity: 'error',
        message: msg || 'Failed to verify the Supabase table.',
      });
    } finally {
      setTableCheckLoading(false);
    }
  }, [dispatch]);

  const handleIngestLookfantastic = React.useCallback(async () => {
    setIngestLoading(true);

    try {
      await dispatch(awinIngestFeed());
      await handleCheckSupabaseTable();
      await handleRefreshSnapshots();
    } finally {
      setIngestLoading(false);
    }
  }, [dispatch, handleCheckSupabaseTable, handleRefreshSnapshots]);

  return (
    <Stack spacing={1} sx={{ my: 1 }}>
      {tableCheckResult ? (
        <Alert
          severity={tableCheckResult.severity}
          sx={{ mb: 1 }}
          action={tableCheckResult.severity === 'warning' ? (
            <Button
              variant="contained"
              onClick={handleIngestLookfantastic}
              disabled={ingestLoading || tableCheckLoading}
            >
              {ingestLoading ? 'Ingesting...' : 'Ingest'}
            </Button>
          ) : null}
        >
          {tableCheckResult.message}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
        <Typography variant="body2">
          <strong>awin_lookfantastic records:</strong>{' '}
          {lookfantasticLoading && lookfantasticCount === 0 ? 'Loading...' : lookfantasticCount}
        </Typography>
        <Typography variant="body2">
          <strong>Last record created:</strong>{' '}
          {lookfantasticLastCreated ? moment(lookfantasticLastCreated).fromNow() : 'N/A'}
        </Typography>
      </Paper>

      {snapshotRows.length > 0 ? (
        <Stack spacing={1}>
          {snapshotRows.map((row: Record<string, any>, index: number) => (
            <Paper key={String(row.id ?? index)} variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2">
                <strong>Created:</strong> {row?.created_at ? moment(row.created_at).fromNow() : '-'}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {String(row.status ?? '-')}
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                <strong>Storage Path:</strong> {String(row.storage_path ?? '-')}
              </Typography>
            </Paper>
          ))}
        </Stack>
      ) : null}

      {snapshotRows.length === 0 && snapshotLoading ? (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="body2">Loading snapshot rows...</Typography>
        </Paper>
      ) : null}


      <Button
        variant="outlined"
        fullWidth
        startIcon={<Icon icon="awin" />}
        onClick={() => dispatch(awinSyncFeed())}
        disabled={tableCheckLoading || ingestLoading}
      >
        Check AWIN Feed for Updates
      </Button>
    </Stack>
  );
}
