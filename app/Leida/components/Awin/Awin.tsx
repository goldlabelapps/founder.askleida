'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Stack,
    SvgIcon,
    TextField,
    Typography,
} from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    type GridRenderCellParams,
    type GridRowSelectionModel,
    type GridSortModel,
} from '@mui/x-data-grid';
import { useDispatch } from '../../../NX/Uberedux';
import { usePaywall } from '../../../NX/Paywall';
import AwinDetail from './components/AwinDetail';
import { processAwin } from './actions/processAwin';
import {
    setLeida,
    setAwin,
    useAwin,
    useDash,
} from '../../../Leida';
import type { T_AwinProcessedPayload, T_AwinProduct } from '../../types';

const RESULTS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 350;

function LinkOutIcon() {
    return (
        <SvgIcon fontSize="small" viewBox="0 0 24 24">
            <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Zm5 16V11h2v10H3V3h10v2H5v14h14Z" />
        </SvgIcon>
    );
}

function asText(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function asId(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }
    return '';
}

function productIdentity(product: T_AwinProduct | null | undefined): string {
    if (!product) {
        return '';
    }

    return asText(product.id)
        || asId(product.id)
        || asText(product.unique_key)
        || asText(product.aw_product_id)
        || asText(product.merchant_product_id);
}

function productName(product: T_AwinProduct | null | undefined): string {
    if (!product) {
        return 'Untitled product';
    }

    return asText(product.product_name)
        || asText(product.title)
        || asText(product.name)
        || 'Untitled product';
}

function productCategory(product: T_AwinProduct | null | undefined): string {
    if (!product) {
        return '';
    }

    return asText(product.category_name) || asText(product.category);
}

function productDeepLink(product: T_AwinProduct | null | undefined): string {
    if (!product) {
        return '';
    }

    return asText(product.aw_deep_link) || asText(product.merchant_deep_link);
}

function productPriceValue(product: T_AwinProduct | null | undefined): number | null {
    if (!product) {
        return null;
    }

    const raw = product.search_price ?? product.price;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
        return raw;
    }
    if (typeof raw === 'string') {
        const normalized = raw.replace(/[^0-9.-]/g, '').trim();
        if (!normalized) {
            return null;
        }
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function formatUkPrice(value: number | null): string {
    if (value === null) {
        return 'N/A';
    }

    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
    }).format(value);
}

function orderByFromSortField(field: string): 'product_name' | 'search_price' | 'brand' {
    if (field === 'price') {
        return 'search_price';
    }

    if (field === 'brand') {
        return 'brand';
    }

    return 'product_name';
}

function sortFieldFromQuery(orderBy: unknown): string {
    if (orderBy === 'search_price') {
        return 'price';
    }

    if (orderBy === 'brand') {
        return 'brand';
    }

    return 'product_name';
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
    const [resultsPerPage, setResultsPerPage] = React.useState(typeof awin?.query?.limit === 'number' ? awin.query.limit : 25);
    const [sortModel, setSortModel] = React.useState<GridSortModel>([
        {
            field: sortFieldFromQuery(awin?.query?.orderBy),
            sort: awin?.query?.orderDir === 'asc' ? 'asc' : 'desc',
        },
    ]);
    const [selectionModel, setSelectionModel] = React.useState<GridRowSelectionModel>({
        type: 'include',
        ids: new Set<string>(),
    });
    const [loading, setLoading] = React.useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [bulkError, setBulkError] = React.useState<string | null>(null);
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
    const [bulkDecision, setBulkDecision] = React.useState<'queue' | 'delete' | null>(null);
    const [refreshNonce, setRefreshNonce] = React.useState(0);

    const activeSort = sortModel[0] || { field: 'product_name', sort: 'desc' as const };
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

    const selectedProducts = React.useMemo(() => {
        if (!selectionModel.ids.size) {
            return [];
        }

        const selectedSet = selectionModel.ids;
        return rows
            .filter((row: { id: string; product: T_AwinProduct }) => selectedSet.has(row.id))
            .map((row: { id: string; product: T_AwinProduct }) => row.product as T_AwinProduct);
    }, [rows, selectionModel]);

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
        setSuccessMessage(decision === 'queue' ? `Added ${productName(processedAwin)} to queue.` : `Deleted ${productName(processedAwin)}.`);
        setBulkError(null);
        setSelectionModel({
            type: 'include',
            ids: new Set<string>(),
        });
        setRefreshNonce((value) => value + 1);
    }, []);

    const handleBulkProcess = React.useCallback(async (decision: 'queue' | 'delete') => {
        if (!selectedProducts.length) {
            return;
        }

        if (!practitionerId) {
            setBulkError('Practitioner ID is required before processing products.');
            return;
        }

        setBulkDecision(decision);
        setBulkError(null);
        setSuccessMessage(null);

        const results = await Promise.all(
            selectedProducts.map(async (product: T_AwinProduct) => ({
                product,
                result: await dispatch(
                    processAwin({
                        awin: product,
                        decision,
                        practitionerId,
                    }) as any,
                ),
            })),
        );

        const succeeded = results.filter(({ result }) => result?.ok);
        const failed = results.filter(({ result }) => !result?.ok);

        if (failed.length) {
            const firstError = failed[0]?.result?.error;
            setBulkError(typeof firstError === 'string' ? firstError : `Failed to ${decision} ${failed.length} products.`);
        }

        if (succeeded.length) {
            const actionLabel = decision === 'queue' ? 'queued' : 'deleted';
            setSuccessMessage(`${succeeded.length} product${succeeded.length === 1 ? '' : 's'} ${actionLabel}.`);
            setSelectionModel({
                type: 'include',
                ids: new Set<string>(),
            });
            setRefreshNonce((value) => value + 1);
        }

        setBulkDecision(null);
    }, [dispatch, practitionerId, selectedProducts]);

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
            const offset = Math.max(0, (page - 1) * resultsPerPage);
            const params = new URLSearchParams({
                limit: String(resultsPerPage),
                offset: String(offset),
                orderBy,
                orderDir,
            });

            if (debouncedSearchTerm.trim()) {
                params.set('q', debouncedSearchTerm.trim());
            }

            const route = `/api/awin?${params.toString()}`;

            setLoading(true);
            setError(null);

            try {
                const res = await fetch(route, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                });

                const json = await res.json().catch(() => null);

                if (!res.ok) {
                    const message = json?.message || `Failed to fetch AWIN results (${res.status})`;
                    throw new Error(message);
                }

                const data = json?.data || {};
                const nextRows = Array.isArray(data?.rows) ? data.rows : [];
                const count = typeof data?.count === 'number' ? data.count : nextRows.length;

                if (cancelled) {
                    return;
                }

                await dispatch(setAwin('rows', nextRows));
                await dispatch(setAwin('products', nextRows));
                await dispatch(setAwin('count', count));
                await dispatch(setAwin('scanned', nextRows.length));
                await dispatch(setAwin('sourceRoute', route));
                await dispatch(setAwin('query', {
                    page,
                    limit: resultsPerPage,
                    offset,
                    orderBy,
                    orderDir,
                    q: debouncedSearchTerm.trim(),
                }));
                setHasLoadedOnce(true);
            } catch (e: unknown) {
                if (cancelled) {
                    return;
                }
                const message = e instanceof Error ? e.message : String(e);
                setError(message || 'AWIN query failed');
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
    }, [debouncedSearchTerm, dispatch, orderBy, orderDir, page, refreshNonce, resultsPerPage]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setLeida('header', {
                title: 'Awin',
                icon: 'awin',
            }));
        }
    }, [dispatch, dash?.title]);

    const columns = React.useMemo<GridColDef[]>(() => {
        return [
            {
                field: 'product_name',
                headerName: 'Product',
                flex: 1.6,
                minWidth: 260,
                sortable: true,
                renderCell: (params: GridRenderCellParams) => (
                    <Button
                        variant="text"
                        sx={{ justifyContent: 'flex-start', textTransform: 'none', px: 0 }}
                        onClick={() => setSelectedAwin(params.row.product as T_AwinProduct)}
                    >
                        {params.value}
                    </Button>
                ),
            },
            {
                field: 'aw_deep_link',
                headerName: 'Link',
                width: 88,
                sortable: false,
                filterable: false,
                align: 'center',
                headerAlign: 'center',
                renderCell: (params: GridRenderCellParams) => {
                    const href = typeof params.value === 'string' ? params.value : '';
                    if (!href) {
                        return <Typography variant="caption" color="text.secondary">N/A</Typography>;
                    }

                    return (
                        <IconButton
                            component="a"
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            aria-label={`Open ${params.row.product_name}`}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <LinkOutIcon />
                        </IconButton>
                    );
                },
            },
            {
                field: 'category_name',
                headerName: 'Category',
                flex: 1,
                minWidth: 180,
                sortable: false,
            },
            {
                field: 'price',
                headerName: 'Price',
                width: 140,
                sortable: true,
                align: 'right',
                headerAlign: 'right',
                renderCell: (params: GridRenderCellParams) => formatUkPrice(typeof params.value === 'number' ? params.value : null),
            },
        ];
    }, []);

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Search products"
                        placeholder="Search by product name"
                        value={searchTerm}
                        onChange={(event) => {
                            setPage(1);
                            setSearchTerm(event.target.value);
                        }}
                    />
                    <Button
                        variant="contained"
                        disabled={!selectionModel.ids.size || Boolean(bulkDecision)}
                        onClick={() => handleBulkProcess('queue')}
                    >
                        {bulkDecision === 'queue' ? <CircularProgress size={18} color="inherit" /> : `Add to queue${selectionModel.ids.size ? ` (${selectionModel.ids.size})` : ''}`}
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        disabled={!selectionModel.ids.size || Boolean(bulkDecision)}
                        onClick={() => handleBulkProcess('delete')}
                    >
                        {bulkDecision === 'delete' ? <CircularProgress size={18} color="inherit" /> : `Delete${selectionModel.ids.size ? ` (${selectionModel.ids.size})` : ''}`}
                    </Button>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    {statusMessage}
                </Typography>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {bulkError ? <Alert severity="error">{bulkError}</Alert> : null}
                {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

                <Box sx={{ width: '100%', minHeight: 560 }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        loading={loading}
                        checkboxSelection
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
                                ? [{ field: nextModel[0].field, sort: nextModel[0].sort === 'asc' ? 'asc' : 'desc' }]
                                : [{ field: 'product_name', sort: 'desc' as const }];
                            setPage(1);
                            setSortModel(normalized);
                        }}
                        rowSelectionModel={selectionModel}
                        onRowSelectionModelChange={(nextSelection) => {
                            const nextIds = new Set(Array.from(nextSelection.ids).map((value) => String(value)));
                            setSelectionModel({
                                type: nextSelection.type,
                                ids: nextIds,
                            });
                        }}
                        sx={{
                            border: 0,
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
                                outline: 'none',
                            },
                        }}
                    />
                </Box>
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