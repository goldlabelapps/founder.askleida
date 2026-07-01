'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';

import type { T_AWINProcessedPayload, T_AWINProduct } from '../../../types.d';
import {
    Backdrop,
    Box,
    CircularProgress,
    Typography,
} from '@mui/material';
import {
    type GridRowSelectionModel,
    type GridSortModel,
} from '@mui/x-data-grid';
import { useDispatch } from '../../../../NX/Uberedux';
import { usePaywall } from '../../../../NX/Paywall';
import { MightyButton, navigateTo, setFeedback } from '../../../../NX/DesignSystem';
import { Editable } from '../../../../NX/NXAdmin';
import {
    asText,
    Back,
    fetchLeida,
    fetchAWINFeedIngestPreflight,
    orderByFromSortField,
    productCategory,
    productDeepLink,
    productIdentity,
    productName,
    productPriceValue,
    setLeida,
    sortFieldFromQuery,
    useAWIN,
    useDash,
    AWINDetail,
    AWINList,
    fetchAWIN,
} from '../../../index';

const RESULTS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 350;
const QUEUE_COUNT_REFRESH_EVENT = 'leida:queue-count-refresh';

function notifyQueueCountRefresh() {
    window.dispatchEvent(new Event(QUEUE_COUNT_REFRESH_EVENT));
}

export default function AWIN() {
    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();
    const awin = useAWIN();
    const paywall = usePaywall();
    const products = (Array.isArray(awin?.products) ? awin.products : []) as T_AWINProduct[];
    const total = typeof awin?.count === 'number' ? awin.count : 0;
    const practitionerId = asText(paywall?.uid) || asText(paywall?.user?.uid);
    const [selectedAWIN, setSelectedAWIN] = React.useState<T_AWINProduct | null>(null);
    const [page, setPage] = React.useState(typeof awin?.query?.page === 'number' ? awin.query.page : 1);
    const [searchTerm, setSearchTerm] = React.useState(typeof awin?.query?.q === 'string' ? awin.query.q : '');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState(typeof awin?.query?.q === 'string' ? awin.query.q : '');
    const clampPageSize = React.useCallback((value: number) => {
        if (!Number.isFinite(value)) return 100;
        return Math.min(100, Math.max(5, Math.floor(value)));
    }, []);

    const [resultsPerPage, setResultsPerPage] = React.useState(
        clampPageSize(typeof awin?.query?.limit === 'number' ? awin.query.limit : 100),
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
    const [loading, setLoading] = React.useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
    const [bulkDecision, setBulkDecision] = React.useState<'queue' | 'delete' | null>(null);
    const [refreshNonce, setRefreshNonce] = React.useState(0);
    const [isInitialLoad, setIsInitialLoad] = React.useState(true);
    const [runningSmokeTest, setRunningSmokeTest] = React.useState(false);

    const activeSort = sortModel[0] || { field: 'product_name', sort: 'asc' as const };
    const orderBy = orderByFromSortField(activeSort.field);
    const orderDir = activeSort.sort === 'asc' ? 'asc' : 'desc';

    const rows = React.useMemo(() => {
        return products.map((product: T_AWINProduct, index: number) => ({
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
    const showEmptyAWINState = !loading && displayedRows.length === 0;

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
    const isTableEmpty = !loading && !activeQuery && total === 0;
    const hideControlsForInitialLoad = loading && isInitialLoad;
    const showAWINControls = !isTableEmpty && !hideControlsForInitialLoad;

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

    const handleProcessed = React.useCallback(async ({ decision, awin: processedAWIN }: T_AWINProcessedPayload) => {
        dispatch(setFeedback({
            severity: 'success',
            title: decision === 'queue'
                ? `${productName(processedAWIN)} was added to the queue.`
                : `Marked ${productName(processedAWIN)} as skipped in the AWIN source table.`,
        }));
        setSelectionModel({
            type: 'include',
            ids: new Set<string>(),
        });
        setRefreshNonce((value) => value + 1);

        if (decision === 'queue') {
            notifyQueueCountRefresh();
            dispatch(navigateTo(router, '/products/queue'));
        }
    }, [dispatch, router]);

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
                dispatch(navigateTo(router, '/products/queue'));
            }

            const actionLabel = decision === 'queue'
                ? 'Queued and marked as queued.'
                : 'Marked as skipped.';
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
    }, [debouncedSearchTerm, dispatch, orderBy, orderDir, practitionerId, router, selectedCount, visibleSelectedIds]);

    const handleRunSmokeTest = React.useCallback(async () => {
        if (runningSmokeTest) {
            return;
        }

        setRunningSmokeTest(true);

        try {
            const result = await dispatch(fetchAWINFeedIngestPreflight());

            if (!result?.ok) {
                throw new Error(result?.error || 'Failed to run smoke test.');
            }

            if (result.skippedIngest || result.configured === false) {
                dispatch(setFeedback({
                    severity: 'warning',
                    title: result.message || 'AWIN ingest is not configured.',
                }));
                return;
            }

            dispatch(setFeedback({
                severity: 'success',
                title: 'AWIN products updated successfully.',
            }));

            setRefreshNonce((value) => value + 1);
            dispatch(navigateTo(router, '/products/awin'));
        } catch (e: unknown) {
            console.error('[Smoke Test] AWIN page smoke test failed', e);
            const message = e instanceof Error ? e.message : String(e);
            dispatch(setFeedback({
                severity: 'warning',
                title: message || 'Failed to run smoke test.',
            }));
        } finally {
            setRunningSmokeTest(false);
        }
    }, [dispatch, router, runningSmokeTest]);

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
                const result = await dispatch(fetchAWIN({
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
        dispatch(setLeida('header', {
            title: total > 0 ? `AWIN (${total})` : 'AWIN',
            icon: 'awin',
        }));
    }, [dispatch, total]);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {showAWINControls ? (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 1.5,
                                alignItems: 'center',
                            }}
                        >
                            <Back kind="icon" />

                            <Box sx={{
                                width: { xs: '100%', md: 320 },
                                maxWidth: '100%',
                            }}>
                                <Editable
                                    variant="standard"
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
                                            icon="close"
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

                            <Box sx={{ flexGrow: 1 }} />

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: 1.5,
                                    alignItems: 'center',
                                }}
                            >

                                <MightyButton
                                    kind="icon"
                                    icon={bulkDecision === 'delete' ? <CircularProgress size={18} color="inherit" /> : 'delete'}
                                    disabled={!selectedCount || Boolean(bulkDecision)}
                                    onClick={() => handleBulkProcess('delete')}
                                />
                                <MightyButton
                                    startIcon="queue"
                                    variant="contained"
                                    disabled={!selectedCount || Boolean(bulkDecision)}
                                    onClick={() => handleBulkProcess('queue')}
                                >
                                    {bulkDecision === 'queue' ? <CircularProgress size={18} color="primary" /> : `Add ${selectedCount ? ` (${selectedCount})` : ''}`}
                                </MightyButton>

                                
                            </Box>
                        </Box>

                        {activeQuery ? (
                            <Typography variant="body2" color="text.secondary">
                                {statusMessage}
                            </Typography>
                        ) : null}
                    </>
                ) : null}

                <AWINList
                    rows={displayedRows}
                    loading={loading}
                    smokeTestLoading={runningSmokeTest}
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
                        setSelectedAWIN(product);
                    }}
                    onRunSmokeTest={handleRunSmokeTest}
                />
            </Box>

            <AWINDetail
                open={Boolean(selectedAWIN)}
                awin={selectedAWIN}
                onClose={() => setSelectedAWIN(null)}
                onProcessed={handleProcessed}
            />

            <Backdrop open={bulkDecision === 'queue'} sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress />
                    <Typography variant="overline">
                        Adding products to queue...
                    </Typography>
                </Box>
            </Backdrop>
        </Box>
    );
}