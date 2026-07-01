'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Pagination,
  Typography,
} from '@mui/material';
import { navigateTo, setFeedback } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import {
  deleteQueueSelection,
  formatUkPrice,
  getQueueRowTitle,
  initQueue,
  MightyButton,
  notifyProductsCountRefresh,
  notifyQueueCountRefresh,
  processQueueItem,
  queueAsText,
  Selected,
  setLeida,
} from '../../../index';
import type { T_QueueListRow, T_QueueRow } from '../../../types.d';

const RESULTS_PER_PAGE = 100;
const RIGHT_LIST_PAGE_SIZE = 10;
const TWEET_MAX_LENGTH = 280;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function pickFirstText(...values: unknown[]): string | null {
  for (const value of values) {
    const text = queueAsText(value);
    if (text) {
      return text;
    }
  }
  return null;
}

function truncateWithEllipsis(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export default function Queue() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [rows, setRows] = React.useState<T_QueueRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [hasQueryError, setHasQueryError] = React.useState(false);
  const [refreshNonce, setRefreshNonce] = React.useState(0);
  const [selectedQueueId, setSelectedQueueId] = React.useState<string | null>(null);
  const [rightPage, setRightPage] = React.useState(1);
  const previousRightPageRef = React.useRef(rightPage);
  const [deletingQueueId, setDeletingQueueId] = React.useState<string | null>(null);
  const [processingQueueId, setProcessingQueueId] = React.useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    dispatch(initQueue());
  }, [dispatch]);

  React.useEffect(() => {
      dispatch(setLeida('header', {
        title: `Queue (${total})`,
        icon: 'queue',
      }));
  }, [dispatch, total]);
  const statusFilter = 'pending';

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setHasQueryError(false);

      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: String(RESULTS_PER_PAGE),
          sortBy: 'updated',
          sortOrder: 'desc',
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
  }, [dispatch, refreshNonce, statusFilter]);

  const queueRows = React.useMemo<T_QueueListRow[]>(() => {
    const mapped = rows.map((row, index) => {
      const queueId = queueAsText(row.queue_id) || queueAsText(row.id) || `queue-${index}`;
      return {
        id: queueId,
        position: index + 1,
        queueId,
        title: getQueueRowTitle(row),
        source: queueAsText(row.source) || null,
        source_table: queueAsText(row.source_table) || null,
        source_product_id: queueAsText(row.source_product_id) || null,
        decision: queueAsText(row.decision) || null,
        status: queueAsText(row.status) || null,
        practitioner_id: queueAsText(row.practitioner_id) || null,
        created: queueAsText(row.created) || null,
        updated: queueAsText(row.updated) || null,
        data: {},
        row,
      };
    });

    return mapped;
  }, [rows]);

  React.useEffect(() => {
    if (!queueRows.length) {
      setSelectedQueueId(null);
      return;
    }

    if (!selectedQueueId) {
      setSelectedQueueId(queueRows[0].id);
      return;
    }

    const stillExists = queueRows.some((row) => row.id === selectedQueueId);
    if (!stillExists) {
      setSelectedQueueId(queueRows[0].id);
    }
  }, [queueRows, selectedQueueId]);

  const selectedRow = React.useMemo(
    () => (selectedQueueId ? queueRows.find((row) => row.id === selectedQueueId) || null : queueRows[0] || null),
    [queueRows, selectedQueueId],
  );

  const selectedImageData = React.useMemo(() => {
    const rowRecord = asRecord(selectedRow?.row);
    const rowData = asRecord(rowRecord?.data);
    const nestedData = asRecord(rowData?.data);

    const thumbnailUrl = pickFirstText(
      rowRecord?.aw_image_url,
      rowData?.aw_image_url,
      nestedData?.aw_image_url,
      rowRecord?.thumbnail,
      rowData?.thumbnail,
      nestedData?.thumbnail,
    );

    const mainImageUrl = pickFirstText(
      rowRecord?.merchant_image_url,
      rowData?.merchant_image_url,
      nestedData?.merchant_image_url,
      rowRecord?.image_url,
      rowData?.image_url,
      nestedData?.image_url,
      rowRecord?.image,
      rowData?.image,
      nestedData?.image,
    );

    const displayPrice = pickFirstText(
      rowRecord?.display_price,
      rowData?.display_price,
      nestedData?.display_price,
    );

    const searchPrice = pickFirstText(
      rowRecord?.search_price,
      rowData?.search_price,
      nestedData?.search_price,
    );

    const currency = pickFirstText(
      rowRecord?.currency,
      rowData?.currency,
      nestedData?.currency,
    );

    const numericFromSearchPrice = searchPrice ? Number(searchPrice) : NaN;
    const numericFromDisplayPrice = displayPrice
      ? Number(String(displayPrice).replace(/[^\d.-]/g, ''))
      : NaN;
    const formattedUkPrice = Number.isFinite(numericFromSearchPrice)
      ? formatUkPrice(numericFromSearchPrice)
      : Number.isFinite(numericFromDisplayPrice)
        ? formatUkPrice(numericFromDisplayPrice)
        : null;

    const priceLabel = formattedUkPrice || displayPrice || (searchPrice ? `${currency || ''}${searchPrice}` : null);

    const awDeepLink = pickFirstText(
      rowRecord?.aw_deep_link,
      rowData?.aw_deep_link,
      nestedData?.aw_deep_link,
    );

    const awProductId = pickFirstText(
      rowRecord?.aw_product_id,
      rowData?.aw_product_id,
      nestedData?.aw_product_id,
    );

    const slug = pickFirstText(
      rowRecord?.slug,
      rowData?.slug,
      nestedData?.slug,
    );

    const merchantName = pickFirstText(
      rowRecord?.merchant_name,
      rowData?.merchant_name,
      nestedData?.merchant_name,
    );

    const merchantDeepLink = pickFirstText(
      rowRecord?.merchant_deep_link,
      rowData?.merchant_deep_link,
      nestedData?.merchant_deep_link,
    );

    return {
      thumbnailUrl,
      mainImageUrl,
      priceLabel,
      awDeepLink,
      awProductId,
      slug,
      merchantName,
      merchantDeepLink,
      description: pickFirstText(
        rowRecord?.description,
        rowData?.description,
        nestedData?.description,
      ),
      descriptionPreview: truncateWithEllipsis(
        pickFirstText(
          rowRecord?.description,
          rowData?.description,
          nestedData?.description,
        ) || 'No description available.',
        TWEET_MAX_LENGTH,
      ),
      displayImageUrl: thumbnailUrl || mainImageUrl,
    };
  }, [selectedRow]);

  const productDataDraft = React.useMemo<Record<string, unknown>>(() => {
    const rowRecord = asRecord(selectedRow?.row);
    const rowData = asRecord(rowRecord?.data);
    const nestedData = asRecord(rowData?.data);

    const thumbnail = pickFirstText(
      rowRecord?.aw_image_url,
      rowData?.aw_image_url,
      nestedData?.aw_image_url,
      rowRecord?.thumbnail,
      rowData?.thumbnail,
      nestedData?.thumbnail,
    );

    const image = pickFirstText(
      rowRecord?.merchant_image_url,
      rowData?.merchant_image_url,
      nestedData?.merchant_image_url,
      rowRecord?.image_url,
      rowData?.image_url,
      nestedData?.image_url,
      rowRecord?.image,
      rowData?.image,
      nestedData?.image,
      thumbnail,
    );

    const productName = pickFirstText(
      rowRecord?.product_name,
      rowData?.product_name,
      nestedData?.product_name,
      selectedRow?.title,
    );

    const rawPrice = pickFirstText(
      rowRecord?.search_price,
      rowData?.search_price,
      nestedData?.search_price,
      rowRecord?.price,
      rowData?.price,
      nestedData?.price,
      rowRecord?.display_price,
      rowData?.display_price,
      nestedData?.display_price,
    );
    const parsedPrice = rawPrice ? Number(String(rawPrice).replace(/[^\d.-]/g, '')) : NaN;
    const price = Number.isFinite(parsedPrice) ? parsedPrice : null;

    return {
      slug: pickFirstText(rowRecord?.slug, rowData?.slug, nestedData?.slug),
      title: productName,
      description: pickFirstText(rowRecord?.description, rowData?.description, nestedData?.description),
      id_awin: pickFirstText(rowRecord?.aw_product_id, rowData?.aw_product_id, nestedData?.aw_product_id),
      url_awin: pickFirstText(rowRecord?.aw_deep_link, rowData?.aw_deep_link, nestedData?.aw_deep_link),
      thumbnail,
      image,
      ...(price !== null ? { price, search_price: price } : {}),
      merchant: pickFirstText(rowRecord?.merchant_name, rowData?.merchant_name, nestedData?.merchant_name),
      id_merchant: pickFirstText(rowRecord?.merchant_product_id, rowData?.merchant_product_id, nestedData?.merchant_product_id),
      url_merchant: pickFirstText(rowRecord?.merchant_deep_link, rowData?.merchant_deep_link, nestedData?.merchant_deep_link),
    };
  }, [selectedRow]);

  const listRows = queueRows;

  const rightPageCount = Math.max(1, Math.ceil(listRows.length / RIGHT_LIST_PAGE_SIZE));

  React.useEffect(() => {
    if (rightPage > rightPageCount) {
      setRightPage(rightPageCount);
    }
  }, [rightPage, rightPageCount]);

  React.useEffect(() => {
    const start = (rightPage - 1) * RIGHT_LIST_PAGE_SIZE;
    const firstRowOnPage = listRows[start] || null;

    if (!firstRowOnPage) {
      previousRightPageRef.current = rightPage;
      return;
    }

    const pageChanged = previousRightPageRef.current !== rightPage;
    previousRightPageRef.current = rightPage;

    if (pageChanged) {
      if (firstRowOnPage.id !== selectedQueueId) {
        setSelectedQueueId(firstRowOnPage.id);
      }
      return;
    }

    const selectedStillExists = selectedQueueId
      ? listRows.some((row) => row.id === selectedQueueId)
      : false;

    if (!selectedStillExists) {
      setSelectedQueueId(firstRowOnPage.id);
    }
  }, [listRows, rightPage, selectedQueueId]);

  const paginatedOtherRows = React.useMemo(() => {
    const start = (rightPage - 1) * RIGHT_LIST_PAGE_SIZE;
    const end = start + RIGHT_LIST_PAGE_SIZE;
    return listRows.slice(start, end);
  }, [listRows, rightPage]);

  const remainingCount = Math.max(0, queueRows.length - 1);

  const handleDeleteSelected = React.useCallback(async () => {
    if (!selectedRow || deletingQueueId) {
      return;
    }

    setDeletingQueueId(selectedRow.id);

    try {
      const result = await dispatch(deleteQueueSelection({
        selection: {
          type: 'include',
          ids: [selectedRow.id],
        },
      }));

      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to delete selected queue item.');
      }

      dispatch(setFeedback({
        severity: 'success',
        title: `Deleted queue item ${selectedRow.position}.`,
      }));

      setRefreshNonce((value) => value + 1);
      notifyQueueCountRefresh();
      notifyProductsCountRefresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      dispatch(setFeedback({
        severity: 'warning',
        title: message || 'Failed to delete selected queue item.',
      }));
    } finally {
      setDeletingQueueId(null);
    }
  }, [deletingQueueId, dispatch, selectedRow]);

  const handleOpenDeleteConfirm = React.useCallback(() => {
    setConfirmDeleteOpen(true);
  }, []);

  const handleCloseDeleteConfirm = React.useCallback(() => {
    setConfirmDeleteOpen(false);
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    setConfirmDeleteOpen(false);
    void handleDeleteSelected();
  }, [handleDeleteSelected]);

  const handleSaveAndProcessSelected = React.useCallback(async () => {
    if (!selectedRow || deletingQueueId || processingQueueId) {
      return;
    }

    const practitionerId = queueAsText(selectedRow.practitioner_id);
    const hasDraft = productDataDraft && Object.keys(productDataDraft).length > 0;

    if (!practitionerId || !hasDraft) {
      dispatch(setFeedback({
        severity: 'warning',
        title: 'Unable to process this queue item due to missing practitioner or product draft data.',
      }));
      return;
    }

    setProcessingQueueId(selectedRow.id);

    try {
      const result = await dispatch(processQueueItem({
        queueId: selectedRow.id,
        practitionerId,
        productDataDraft,
      }));

      if (!result?.ok) {
        throw new Error(result?.error || 'Failed to process selected queue item.');
      }

      dispatch(setFeedback({
        severity: 'success',
        title: `Saved and processed queue item ${selectedRow.position}.`,
      }));

      setRefreshNonce((value) => value + 1);
      notifyQueueCountRefresh();
      notifyProductsCountRefresh();
      dispatch(navigateTo(router, '/products'));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      dispatch(setFeedback({
        severity: 'warning',
        title: message || 'Failed to process selected queue item.',
      }));
    } finally {
      setProcessingQueueId(null);
    }
  }, [deletingQueueId, dispatch, processingQueueId, productDataDraft, router, selectedRow]);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {loading ? (
          <Box sx={{ py: 1 }}>
            <CircularProgress size={20} />
          </Box>
        ) : null}

        {!loading && !hasQueryError && queueRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No queue items found.
          </Typography>
        ) : null}

        {!loading && !hasQueryError && selectedRow ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
            }}
          >
            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
              <Box sx={{flexGrow: 1}} />
              <Box>
                <MightyButton
                  variant="outlined"
                  startIcon="awin"
                  onClick={() => {
                    dispatch(navigateTo(router, '/products/awin'));
                  }}
                >
                  Add more
                </MightyButton>
              </Box>
            </Box>

            <Box sx={{ height: 16 }} />

            <Box key={selectedRow.id}>
              <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Selected
                  selectedRow={selectedRow}
                  selectedImageData={selectedImageData}
                  productDataDraft={productDataDraft}
                  deletingQueueId={deletingQueueId}
                  processingQueueId={processingQueueId}
                  confirmDeleteOpen={confirmDeleteOpen}
                  onOpenDeleteConfirm={handleOpenDeleteConfirm}
                  onSaveAndProcess={handleSaveAndProcessSelected}
                  onConfirmDelete={handleConfirmDelete}
                  onCloseDeleteConfirm={handleCloseDeleteConfirm}
                />
              </Box>
            </Box>

            <Box>

              {listRows.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                  No queue items.
                </Typography>
              ) : (
                <>
                  <Box sx={{ height: 32 }} />
                  {listRows.length > RIGHT_LIST_PAGE_SIZE ? (
                    <Box sx={{ px: 1, py: 0.5, display: 'flex', justifyContent: 'flex-start' }}>
                      
                      <Pagination
                        color="primary"
                        count={rightPageCount}
                        page={rightPage}
                        onChange={(_, nextPage) => setRightPage(nextPage)}
                      />
                    </Box>
                  ) : null}
                  <Box sx={{ height: 32 }} />
                  <List disablePadding dense>
                    {paginatedOtherRows.map((row) => (
                      <ListItemButton
                        key={row.id}
                        onClick={() => setSelectedQueueId(row.id)}
                        disabled={Boolean(deletingQueueId) || row.id === selectedQueueId}
                        selected={row.id === selectedQueueId}
                        sx={{ py: 0.25, px: 1 }}
                      >
                        <ListItemText
                          primary={`#${row.position} ${row.title}`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            noWrap: true,
                            sx: { fontSize: '0.8rem' },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </>
              )}
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
