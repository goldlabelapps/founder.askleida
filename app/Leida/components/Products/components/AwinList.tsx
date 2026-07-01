'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { T_AWINListProps, T_AWINProduct } from '../../../types.d';
import { Box, IconButton, Typography } from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    type GridRenderCellParams,
} from '@mui/x-data-grid';
import { formatUkPrice, getAffiliateImageUrl, setLeida, Thumbnail } from '../../../index';
import { LEIDA_DATA_GRID_SX } from '../../UI';
import { BlockingOverlay, Icon, MightyButton, navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';

export default function AWINList({
    rows,
    loading,
    smokeTestLoading = false,
    activeQuery = '',
    total,
    page,
    resultsPerPage,
    pageSizeOptions,
    sortModel,
    selectionModel,
    onPaginationModelChange,
    onSortModelChange,
    onRowSelectionModelChange,
    onOpenProduct,
    onRunSmokeTest,
    
}: T_AWINListProps) {

    const dispatch = useDispatch();
    const router = useRouter();

    React.useEffect(() => {
        dispatch(setLeida('header', {
            title: 'AWIN',
            icon: 'awin',
        }));
    }, [dispatch]);
    
    const columns = React.useMemo<GridColDef[]>(() => {
        return [
            {
                field: 'thumbnail',
                headerName: '',
                width: 72,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderCell: (params: GridRenderCellParams) => (
                    <Thumbnail
                        src={getAffiliateImageUrl(params.row.product as T_AWINProduct)}
                        alt="Affiliate thumbnail"
                        size={40}
                    />
                ),
            },
            {
                field: 'product_name',
                headerName: ' ',
                renderHeader: () => null,
                flex: 1.6,
                minWidth: 260,
                sortable: true,
                renderCell: (params: GridRenderCellParams) => (
                    <MightyButton
                        variant="text"
                        sx={{ justifyContent: 'flex-start', textTransform: 'none', px: 0 }}
                        onClick={() => {
                            onOpenProduct(params.row.product as T_AWINProduct, String(params.row.id));
                        }}
                    >
                        {params.value}
                    </MightyButton>
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
                            <Icon icon="link" />
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
    }, [onOpenProduct]);

    if (loading && rows.length === 0) {
        return (
            <BlockingOverlay open label="Loading AWIN products..." />
        );
    }

    if (!loading && rows.length === 0) {
        const trimmedQuery = activeQuery.trim();
        const showTableEmptyState = total === 0 && !trimmedQuery;

        if (!showTableEmptyState) {
            if (trimmedQuery) {
                return null;
            }

            return (
                <Box sx={{ width: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                        No products found.
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ width: '100%' }}>
                    <Typography variant="h6">
                        AWIN table empty. Run Smoke Test.
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        This will ingest the latest AWIN feed into products_awin.
                    </Typography>
                    <Box sx={{ height: 24 }} />
                    <MightyButton
                        alignLeft
                        variant="outlined"
                        startIcon="products"
                        onClick={() => {
                            dispatch(navigateTo(router, '/products'));
                        }}
                    >
                        Manage Products
                    </MightyButton>
            </Box>
        );
    }

    return loading || rows.length > 0 ? (
        <Box sx={{ width: '100%', minHeight: 560 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    columns: {
                        columnVisibilityModel: {
                            aw_deep_link: false,
                            category_name: false,
                            price: false,
                        },
                    },
                }}
                loading={loading}
                checkboxSelection
                disableRowSelectionOnClick
                pagination
                paginationMode="server"
                sortingMode="server"
                rowCount={total}
                pageSizeOptions={pageSizeOptions}
                paginationModel={{ page: page - 1, pageSize: resultsPerPage }}
                onPaginationModelChange={onPaginationModelChange}
                sortModel={sortModel}
                onSortModelChange={onSortModelChange}
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={onRowSelectionModelChange}
                onCellClick={(params) => {
                    if (params.field === '__check__') {
                        return;
                    }

                    onOpenProduct(params.row.product as T_AWINProduct, String(params.row.id));
                }}
                sx={LEIDA_DATA_GRID_SX}
            />
        </Box>
    ) : null;
}