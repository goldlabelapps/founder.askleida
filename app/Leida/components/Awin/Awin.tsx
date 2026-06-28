'use client';
import * as React from 'react';

import type { T_AwinProcessedPayload, T_AwinProduct } from '../../types.d';
import {
    Box,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material';
import {
    type GridRowSelectionModel,
    type GridSortModel,
} from '@mui/x-data-grid';
import { useDispatch } from '../../../NX/Uberedux';
import { usePaywall } from '../../../NX/Paywall';
import { setFeedback } from '../../../NX/DesignSystem';
import { Editable } from '../../../NX/NXAdmin';
import {
    asText,
    fetchLeida,
    MightyButton,
    orderByFromSortField,
    productCategory,
    productDeepLink,
    productIdentity,
    productName,
    productPriceValue,
    setLeida,
    sortFieldFromQuery,
    useAwin,
    useDash,
    AwinDetail,
    AwinList,
    fetchAwin,
} from '../../../Leida';

const RESULTS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 350;
const QUEUE_COUNT_REFRESH_EVENT = 'leida:queue-count-refresh';

function notifyQueueCountRefresh() {
    window.dispatchEvent(new Event(QUEUE_COUNT_REFRESH_EVENT));
}

export default function Awin() {
    const dispatch = useDispatch();
    const dash = useDash();
    const awin = useAwin();
    const paywall = usePaywall();
    const products = (Array.isArray(awin?.products) ? awin.products : []) as T_AwinProduct[];
    const total = typeof awin?.count === 'number' ? awin.count : 0;
    const practitionerId = asText(paywall?.uid) || asText(paywall?.user?.uid);
    const [selectedAwin, setSelectedAwin] = React.useState<T_AwinProduct | null>(null);
    const [page, setPage] = React.useState(typeof awin?.query?.page === 'number' ? awin.query.page : 1);
    const [searchTerm, setSearchTerm] = React.useState(typeof awin?.query?.q === 'string' ? awin.query.q : '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(typeof awin?.query?.q === 'string' ? awin.query.q : '');
    const clampPageSize = React.useCallback((value: number) => {
        if (!Number.isFinite(value)) return 10;
        return Math.min(100, Math.max(5, Math.floor(value)));
    }, []);

    const [resultsPerPage, setResultsPerPage] = React.useState(
        clampPageSize(typeof awin?.query?.limit === 'number' ? awin.query.limit : 10),
    );
    const [sortModel, setSortModel] = React.useState<GridSortModel>([
        {
            field: sortFieldFromQuery(awin?.query?.orderBy),
            sort: awin?.query?.orderDir === 'desc' ? 'desc' : 'asc',
        },
    ]);
    const [selectionModel, setSelectionModel] = React.useState<GridRowSelectionModel>({
        type: 'include',
        ids: new Set<string>(),
    });
    const [loading, setLoading] = React.useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
    const [bulkDecision, setBulkDecision] = React.useState<'queue' | 'delete' | null>(null);
    const [refreshNonce, setRefreshNonce] = React.useState(0);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);

    const activeSort = sortModel[0] || { field: 'product_name', sort: 'asc' as const };
    const orderBy = orderByFromSortField(activeSort.field);
    const orderDir = activeSort.sort === 'asc' ? 'asc' : 'desc';

    const rows = React.useMemo(() => {
        return products.map((product: T_AwinProduct, index: number) => ({
            id: productIdentity(product) || `awin-row-${index}`,
            product_name: productName(product),
            category_name: productCategory(product),
            price: productPriceValue(product),
            aw_deep_link: productDeepLink(product),
            product,
        }));
    }, [products]);

    const displayedRows = isInitialLoad ? [] : rows;
    const displayedTotal = isInitialLoad ? 0 : total;

    const visibleRowIds = React.useMemo(() => {
        return new Set(rows.map((row) => String(row.id)));
    }, [rows]);

    const visibleSelectedIds = React.useMemo(() => {
        // Bulk actions should only operate on checked rows visible in the current grid page.
        return Array.from(selectionModel.ids)
            .map((value) => String(value))
            .filter((id) => visibleRowIds.has(id));
    }, [selectionModel.ids, visibleRowIds]);

    const selectedCount = visibleSelectedIds.length;

    const totalPages = Math.max(1, Math.ceil(total / resultsPerPage));
    const activeQuery = debouncedSearchTerm.trim();

    const statusMessage = React.useMemo(() => {
        if (loading) {
            return `Searching ${activeQuery ? `for "${activeQuery}"` : 'all products'}...`;
        }

        if (!hasLoadedOnce) {
            return 'Ready to search';
        }

        if (total === 0 && activeQuery) {
            return `Nothing found for "${activeQuery}"`;
        }

        const suffix = activeQuery ? ` for "${activeQuery}"` : '';
        return `${total} results${suffix}, page ${page} of ${totalPages}.`;
    }, [activeQuery, hasLoadedOnce, loading, page, total, totalPages]);

    const handleProcessed = React.useCallback(async ({ decision, awin: processedAwin }: T_AwinProcessedPayload) => {
        dispatch(setFeedback({
            severity: 'success',
            title: decision === 'queue'
                ? `Queued ${productName(processedAwin)} and removed it from the AWIN source table.`
                : `Deleted ${productName(processedAwin)}.`,
        }));
        setSelectionModel({
            type: 'include',
            ids: new Set<string>(),
        });
        setRefreshNonce((value) => value + 1);

        if (decision === 'queue') {
            notifyQueueCountRefresh();
        }
    }, [dispatch]);

    const handleBulkProcess = React.useCallback(async (decision: 'queue' | 'delete') => {
        if (!visibleSelectedIds.length) {
            return;
        }

        if (!practitionerId) {
            dispatch(setFeedback({
                severity: 'warning',
                title: 'Practitioner ID is required before processing products.',
            }));
            return;
        }

        setBulkDecision(decision);

        try {
            const res = await fetch('/api/awin/lookfantastic/queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    practitioner_id: practitionerId,
                    decision,
                    awinQuery: {
                        q: debouncedSearchTerm.trim(),
                        orderBy,
                        orderDir,
                    },
                    selection: {
                        type: 'include',
                        ids: visibleSelectedIds,
                    },
                }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok) {
                const message = json?.message || `Failed to ${decision} selected products (${res.status})`;
                throw new Error(message);
            }

            const processedCount = typeof json?.data?.processedCount === 'number'
                ? json.data.processedCount
                : selectedCount;

            if (decision === 'queue') {
                await dispatch(fetchLeida('/api/products/queue'));
                notifyQueueCountRefresh();
            }

            const actionLabel = decision === 'queue'
                ? 'Queued and removed.'
                : 'Deleted.';
            dispatch(setFeedback({
                severity: 'success',
                title: `${processedCount} product${processedCount === 1 ? '' : 's'} ${actionLabel}.`,
            }));
            setSelectionModel({
                type: 'include',
                ids: new Set<string>(),
            });
            setRefreshNonce((value) => value + 1);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            dispatch(setFeedback({
                severity: 'warning',
                title: message || `Failed to ${decision} selected products.`,
            }));
        } finally {
            setBulkDecision(null);
        }
    }, [debouncedSearchTerm, dispatch, orderBy, orderDir, practitionerId, selectedCount, visibleSelectedIds]);

    React.useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    React.useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    React.useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);

            try {
                const result = await dispatch(fetchAwin({
                    page,
                    limit: resultsPerPage,
                    orderBy,
                    orderDir,
                    q: debouncedSearchTerm,
                }));

                if (cancelled) {
                    return;
                }

                if (!result?.ok) {
                    throw new Error(result?.error || 'AWIN query failed');
                }

                setHasLoadedOnce(true);
            } catch (e: unknown) {
                if (cancelled) {
                    return;
                }
                const message = e instanceof Error ? e.message : String(e);
                dispatch(setFeedback({
                    severity: 'warning',
                    title: message || 'AWIN query failed',
                }));
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setIsInitialLoad(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [debouncedSearchTerm, dispatch, orderBy, orderDir, page, refreshNonce, resultsPerPage]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setLeida('header', {
                title: 'Awin',
                icon: 'awin',
            }));
        }
    }, [dispatch, dash?.title]);

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', md: 'center' }}
                    justifyContent="space-between"
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <MightyButton
                            variant="outlined"
                            startIcon="delete"
                            disabled={!selectedCount || Boolean(bulkDecision)}
                            onClick={() => handleBulkProcess('delete')}
                        >
                            {bulkDecision === 'delete' ? <CircularProgress size={18} color="inherit" /> : `Delete${selectedCount ? ` (${selectedCount})` : ''}`}
                        </MightyButton>

                        <MightyButton
                            startIcon="queue"
                            variant="contained"
                            disabled={!selectedCount || Boolean(bulkDecision)}
                            onClick={() => handleBulkProcess('queue')}
                        >
                            {bulkDecision === 'queue' ? <CircularProgress size={18} color="inherit" /> : `Add${selectedCount ? ` (${selectedCount})` : ''}`}
                        </MightyButton>
                    </Stack>

                    <Box sx={{ width: { xs: '100%', md: 380 }, maxWidth: '100%', ml: { md: 'auto' } }}>
                        <Editable
                            variant="filled"
                            placeholder="Search Awin"
                            value={searchTerm}
                            onChange={(value: string) => {
                                setPage(1);
                                setSearchTerm(value);
                            }}
                            disabled={Boolean(bulkDecision)}
                            startAdornment={'search'}
                            endAdornment={(
                                <MightyButton
                                    kind="icon"
                                    icon="cancel"
                                    disabled={!searchTerm.trim() || Boolean(bulkDecision)}
                                    onClick={() => {
                                        setPage(1);
                                        setSearchTerm('');
                                        setDebouncedSearchTerm('');
                                    }}
                                />
                            )}
                        />
                    </Box>
                </Stack>

                {activeQuery ? (
                    <Typography variant="body2" color="text.secondary">
                        {statusMessage}
                    </Typography>
                ) : null}

                <AwinList
                    rows={displayedRows}
                    loading={loading}
                    total={displayedTotal}
                    page={page}
                    resultsPerPage={resultsPerPage}
                    pageSizeOptions={RESULTS_PER_PAGE_OPTIONS}
                    sortModel={sortModel}
                    selectionModel={selectionModel}
                    onPaginationModelChange={(model) => {
                        setPage((typeof model?.page === 'number' ? model.page : 0) + 1);
                        if (typeof model?.pageSize === 'number' && model.pageSize !== resultsPerPage) {
                            setPage(1);
                            setResultsPerPage(clampPageSize(model.pageSize));
                        }
                    }}
                    onSortModelChange={(nextModel) => {
                        const normalized: GridSortModel = Array.isArray(nextModel) && nextModel.length
                            ? [{ field: nextModel[0].field, sort: nextModel[0].sort === 'asc' ? 'asc' : 'desc' }]
                            : [{ field: 'product_name', sort: 'asc' as const }];
                        setPage(1);
                        setSortModel(normalized);
                    }}
                    onRowSelectionModelChange={(nextSelection) => {
                        const nextIds = nextSelection.type === 'exclude'
                            ? new Set(Array.from(visibleRowIds))
                            : new Set(
                                Array.from(nextSelection.ids)
                                    .map((value) => String(value))
                                    .filter((id) => visibleRowIds.has(id)),
                            );
                        setSelectionModel({
                            type: 'include',
                            ids: nextIds,
                        });
                    }}
                    onOpenProduct={(product, rowId) => {
                        setSelectedAwin(product);
                    }}
                />
            </Stack>

            <AwinDetail
                open={Boolean(selectedAwin)}
                awin={selectedAwin}
                onClose={() => setSelectedAwin(null)}
                onProcessed={handleProcessed}
            />
        </Box>
    );
}