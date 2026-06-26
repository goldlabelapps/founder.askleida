'use client';
import * as React from 'react';
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { initQueue, setLeida, useDash, useLeidaBus, useQueue } from '../../../../Leida';

type T_QueueRow = {
  id?: string | number | null;
  source?: string | null;
  source_table?: string | null;
  source_product_id?: string | null;
  decision?: string | null;
  status?: string | null;
  practitioner_id?: string | null;
  created?: string | null;
  updated?: string | null;
  [key: string]: unknown;
};

function toLabel(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown';
  return value.replace(/_/g, ' ');
}

function toDate(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return '—';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

export default function Queue() {
  const dispatch = useDispatch();
  const dash = useDash();
  const queueSlice = useQueue();
  const bus = useLeidaBus('/api/products/queue');

  React.useEffect(() => {
    dispatch(initQueue());
  }, [dispatch]);

  React.useEffect(() => {
    if (dash && dash.title) {
      dispatch(setLeida('header', {
        title: 'Queue',
        icon: 'folder',
      }));
    }
  }, [dispatch, dash?.title]);

  const rows = React.useMemo(() => {
    const fromSlice = Array.isArray(queueSlice?.rows)
      ? (queueSlice.rows as T_QueueRow[])
      : [];
    const fromBus = Array.isArray(bus?.data)
      ? (bus.data as T_QueueRow[])
      : [];

    if (fromSlice.length > 0) return fromSlice;
    return fromBus;
  }, [queueSlice?.rows, bus?.data]);

  const loading = Boolean(queueSlice?.loading) || Boolean(bus?.loading);
  const error = typeof queueSlice?.error === 'string' && queueSlice.error
    ? queueSlice.error
    : (typeof bus?.error === 'string' ? bus.error : null);

  return (
    <Box sx={{ p: 2 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5">Queue</Typography>
            <Typography variant="body2" color="text.secondary">
              Pending and processed product queue items from Supabase.
            </Typography>
          </Box>

          <Box sx={{ height: 6 }}>
            {loading ? <LinearProgress /> : null}
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {!loading && !error && rows.length === 0 ? (
            <Alert severity="info">No queue items found.</Alert>
          ) : null}

          {rows.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Decision</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Table</TableCell>
                    <TableCell>Product ID</TableCell>
                    <TableCell>Practitioner</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => {
                    const key = row.id ?? `${row.source_product_id || 'queue'}-${index}`;

                    return (
                      <TableRow hover key={String(key)}>
                        <TableCell>
                          <Chip size="small" label={toLabel(row.status)} />
                        </TableCell>
                        <TableCell>{toLabel(row.decision)}</TableCell>
                        <TableCell>{row.source || '—'}</TableCell>
                        <TableCell>{row.source_table || '—'}</TableCell>
                        <TableCell>{row.source_product_id || '—'}</TableCell>
                        <TableCell>{row.practitioner_id || '—'}</TableCell>
                        <TableCell>{toDate(row.created)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  );
}