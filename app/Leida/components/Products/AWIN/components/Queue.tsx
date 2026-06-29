'use client';
import * as React from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridSortModel,
} from '@mui/x-data-grid';
import { setFeedback } from '../../../../../NX/DesignSystem';
import { useDispatch } from '../../../../../NX/Uberedux';
import { initQueue, MightyButton, processQueueItem, setLeida } from '../../../../index';
import type { T_QueueRow } from '../../../../types.d';
import { toDate } from '../../../../lib/toDate';
import { toLabel } from '../../../../lib/toLabel';

const RESULTS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const QUEUE_COUNT_REFRESH_EVENT = 'leida:queue-count-refresh';
const PRODUCTS_COUNT_REFRESH_EVENT = 'leida:products-count-refresh';

type T_QueueListRow = {
  id: string;
  position: number;
  queueId: string;
  title: string;
  source: string | null;
  source_table: string | null;
  source_product_id: string | null;
  decision: string | null;
  status: string | null;
  practitioner_id: string | null;
  created: string | null;
  updated: string | null;
  data: Record<string, unknown>;
  row: T_QueueRow;
};

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getQueueRowTitle(row: T_QueueRow): string {
  const data = asObject(row?.data);
  const basic = asObject(data.product_basic);

  const candidates: unknown[] = [
    data.product_name,
    basic.title,
    basic.name,
    data.title,
    data.name,
    row?.source_product_id,
    data.merchant_product_id,
    data.aw_product_id,
  ];

  for (const value of candidates) {
    const text = asText(value);
    if (text) {
      return text;
    }
  }

  return 'Queue item';
}

function notifyQueueCountRefresh() {
  window.dispatchEvent(new Event(QUEUE_COUNT_REFRESH_EVENT));
}

function notifyProductsCountRefresh() {
  window.dispatchEvent(new Event(PRODUCTS_COUNT_REFRESH_EVENT));
}

export default function Queue() {
  const dispatch = useDispatch();

  const [rows, setRows] = React.useState<T_QueueRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [resultsPerPage, setResultsPerPage] = React.useState(100);
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: 'created', sort: 'asc' },
  ]);
  const [loading, setLoading] = React.useState(false);
  const [hasQueryError, setHasQueryError] = React.useState(false);
  const [selectedQueueId, setSelectedQueueId] = React.useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = React.useState(0);
  const [processOpen, setProcessOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const [editedPayload, setEditedPayload] = React.useState('');
  const hasAutoSelectedInitialRowRef = React.useRef(false);

  React.useEffect(() => {
    dispatch(initQueue());
  }, [dispatch]);

  React.useEffect(() => {
      dispatch(setLeida('header', {
        title: `Queue (Total ${total})`,
        icon: 'queue',
      }));
  }, [dispatch, total]);

  const activeSort = sortModel[0] || { field: 'created', sort: 'asc' as const };
  const sortBy = (() => {
    switch (activeSort.field) {
      case 'updated':
        return 'updated';
      case 'status':
        return 'status';
      case 'decision':
        return 'decision';
      case 'source_table':
        return 'source_table';
      default:
        return 'created';
    }
  })();
  const sortOrder = activeSort.sort === 'desc' ? 'desc' : 'asc';
  const statusFilter = 'pending';

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setHasQueryError(false);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(resultsPerPage),
          sortBy,
          sortOrder,
        });

        if (statusFilter) {
          params.set('status', statusFilter);
        }

        const res = await fetch(`/api/products/queue?${params.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const message = json?.message || `Failed to fetch queue (${res.status})`;
          throw new Error(message);
        }

        if (cancelled) {
          return;
        }

        const data = json?.data || {};
        const nextRows = Array.isArray(data?.rows) ? data.rows : [];
        const nextTotal = typeof data?.total === 'number' ? data.total : nextRows.length;

        setRows(nextRows as T_QueueRow[]);
        setTotal(nextTotal);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setHasQueryError(true);
        dispatch(setFeedback({
          severity: 'warning',
          title: message || 'Queue query failed',
        }));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [dispatch, page, refreshNonce, resultsPerPage, sortBy, sortOrder, statusFilter]);

  const gridRows = React.useMemo<T_QueueListRow[]>(() => {
    const mapped = rows.map((row, index) => {
      const queueId = asText(row.queue_id) || asText(row.id) || `queue-${index}`;
      return {
        id: queueId,
        position: ((page - 1) * resultsPerPage) + index + 1,
        queueId,
        title: getQueueRowTitle(row),
        source: asText(row.source) || null,
        source_table: asText(row.source_table) || null,
        source_product_id: asText(row.source_product_id) || null,
        decision: asText(row.decision) || null,
        status: asText(row.status) || null,
        practitioner_id: asText(row.practitioner_id) || null,
        created: asText(row.created) || null,
        updated: asText(row.updated) || null,
        data: asObject(row.data),
        row,
      };
    });

    return mapped;
  }, [page, resultsPerPage, rows]);

  React.useEffect(() => {
    if (!gridRows.length) {
      setSelectedQueueId(null);
      return;
    }

    const exists = selectedQueueId
      ? gridRows.some((row) => row.id === selectedQueueId)
      : false;

    if (selectedQueueId && !exists) {
      setSelectedQueueId(null);
    }
  }, [gridRows, selectedQueueId]);

  React.useEffect(() => {
    if (hasAutoSelectedInitialRowRef.current || selectedQueueId || !gridRows.length) {
      return;
    }

    hasAutoSelectedInitialRowRef.current = true;
    setSelectedQueueId(gridRows[0].id);
  }, [gridRows, selectedQueueId]);

  const selectedRow = React.useMemo(
    () => (selectedQueueId ? gridRows.find((row) => row.id === selectedQueueId) || null : null),
    [gridRows, selectedQueueId],
  );

  const listRows = React.useMemo(() => {
    if (!selectedQueueId) {
      return gridRows;
    }

    return gridRows.filter((row) => row.id !== selectedQueueId);
  }, [gridRows, selectedQueueId]);

  const visibleRowIds = React.useMemo(() => {
    return new Set(gridRows.map((row) => String(row.id)));
  }, [gridRows]);

  const openProcessDialog = React.useCallback(() => {
    if (!selectedRow) {
      return;
    }

    setEditedPayload(JSON.stringify(selectedRow.data || {}, null, 2));
    setProcessOpen(true);
  }, [selectedRow]);

  const handleProcessConfirm = React.useCallback(async () => {
    if (!selectedRow || processing) {
      return;
    }

    setProcessing(true);

    try {
      let awinProduct: Record<string, unknown>;
      try {
        const parsed = JSON.parse(editedPayload);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Edited payload must be a JSON object.');
        }
        awinProduct = parsed as Record<string, unknown>;
      } catch (jsonError: unknown) {
        const message = jsonError instanceof Error ? jsonError.message : String(jsonError);
        throw new Error(message || 'Invalid JSON payload.');
      }

      const practitionerId = selectedRow.practitioner_id || '';
      if (!practitionerId) {
        throw new Error('Selected queue row is missing practitioner_id.');
      }

      const result = await dispatch(processQueueItem({
        queueId: selectedRow.id,
        practitionerId,
        awinProduct,
      }));

      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to process selected queue item.');
      }

      setProcessOpen(false);
      dispatch(setFeedback({
        severity: 'success',
        title: 'Processed selected queue item and removed it from the queue.',
      }));
      setRefreshNonce((value) => value + 1);
      notifyQueueCountRefresh();
      notifyProductsCountRefresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      dispatch(setFeedback({
        severity: 'warning',
        title: message || 'Failed to process selected queue item.',
      }));
    } finally {
      setProcessing(false);
    }
  }, [dispatch, editedPayload, processing, selectedRow]);

  const columns = React.useMemo<GridColDef[]>(() => {
    return [
      {
        field: 'position',
        headerName: '#',
        width: 72,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'title',
        headerName: '',
        flex: 1.5,
        minWidth: 280,
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Button
            variant="text"
            sx={{ justifyContent: 'flex-start', textTransform: 'none', px: 0 }}
            onClick={() => {
              setSelectedQueueId(String(params.row.id));
            }}
          >
            {String(params.value || 'Queue item')}
          </Button>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        sortable: true,
        renderCell: (params: GridRenderCellParams) => (
          <Chip size="small" label={toLabel(params.value)} />
        ),
      },
      {
        field: 'decision',
        headerName: 'Decision',
        width: 120,
        sortable: true,
        renderCell: (params: GridRenderCellParams) => toLabel(params.value),
      },
      {
        field: 'source_table',
        headerName: 'Table',
        width: 170,
        sortable: true,
      },
      {
        field: 'source_product_id',
        headerName: 'Source Product ID',
        minWidth: 220,
        flex: 1,
        sortable: false,
      },
      {
        field: 'created',
        headerName: 'Created',
        width: 180,
        sortable: true,
        renderCell: (params: GridRenderCellParams) => toDate(params.value),
      },
    ];
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>


          <Box sx={{ flexGrow: 1 }} />
        </Stack>

        {!loading && !hasQueryError && listRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No queue items found.
          </Typography>
        ) : null}

        {selectedRow ? (
          <Box
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 2,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{ width: 40, height: 40, flex: '0 0 auto' }}
              >
                1
              </Avatar>
              <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="overline">
                  Next product
                </Typography>
                <Typography variant="subtitle1">
                  {selectedRow.title}
                </Typography>
                <Box>
                <MightyButton
                  variant="contained"
                  endIcon="start"
                  disabled={processing}
                  onClick={openProcessDialog}
                >
                  {processing ? <CircularProgress size={18} color="inherit" /> : 'Start'}
                </MightyButton>
              </Box>
              </Stack>
            </Stack>
          </Box>
        ) : null}

        {loading || listRows.length > 0 ? (
          <Box sx={{ width: '100%' }}>
            <DataGrid
              rows={listRows}
              columns={columns}
              autoHeight
              columnHeaderHeight={0}
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    decision: false,
                    source_table: false,
                    source_product_id: false,
                    created: false,
                  },
                },
              }}
              loading={loading}
              disableRowSelectionOnClick
              pagination
              paginationMode="server"
              sortingMode="server"
              rowCount={total}
              pageSizeOptions={RESULTS_PER_PAGE_OPTIONS}
              paginationModel={{ page: page - 1, pageSize: resultsPerPage }}
              onPaginationModelChange={(model) => {
                setPage((typeof model?.page === 'number' ? model.page : 0) + 1);
                if (typeof model?.pageSize === 'number' && model.pageSize !== resultsPerPage) {
                  setPage(1);
                  setResultsPerPage(model.pageSize);
                }
              }}
              sortModel={sortModel}
              onSortModelChange={(nextModel) => {
                const normalized: GridSortModel = Array.isArray(nextModel) && nextModel.length
                  ? [{ field: nextModel[0].field, sort: nextModel[0].sort === 'desc' ? 'desc' : 'asc' }]
                  : [{ field: 'created', sort: 'asc' as const }];
                setPage(1);
                setSortModel(normalized);
              }}
              onCellClick={(params) => {
                setSelectedQueueId(String(params.row.id));
              }}
              sx={{
                border: 0,
                '& .MuiDataGrid-columnHeaders': {
                  display: 'none',
                },
                '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
                  outline: 'none',
                },
              }}
            />
          </Box>
        ) : null}
      </Stack>

      <Dialog
        open={processOpen}
        onClose={() => setProcessOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Confirm + edit queue payload
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Review and edit the payload before sending it to the AWIN save route. This is the one-by-one AI handoff step.
            </Typography>

            {selectedRow ? (
              <Typography variant="caption" color="text.secondary">
                Queue ID: {selectedRow.queueId} | Practitioner: {selectedRow.practitioner_id || 'N/A'}
              </Typography>
            ) : null}

            <TextField
              multiline
              minRows={16}
              fullWidth
              value={editedPayload}
              onChange={(event) => setEditedPayload(event.target.value)}
              placeholder={'{\n  "product_name": "..."\n}'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessOpen(false)} color="inherit" disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleProcessConfirm} variant="contained" disabled={!selectedRow || processing}>
            {processing ? 'Processing...' : 'Confirm and process'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
