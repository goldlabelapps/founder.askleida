'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { T_AWINListProps, T_AWINProduct } from '../../../types.d';
import { Box, IconButton, LinearProgress, Stack, Typography } from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    type GridRenderCellParams,
} from '@mui/x-data-grid';
import { formatUkPrice, MightyButton, setLeida, } from '../../../index';
import { Icon, navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';

export default function AWINList({
    rows,
    loading,
    smokeTestLoading = false,
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
            <Box sx={{ width: '100%', py: 2 }}>
                <LinearProgress />
            </Box>
        );
    }

    if (!loading && rows.length === 0) {
        return (
            <Box sx={{ width: '100%', py: 6 }}>
                <Stack spacing={2} alignItems="center" textAlign="center" sx={{ maxWidth: 560, mx: 'auto' }}>
                    <Typography variant="h6">
                        AWIN table empty. Run Smoke Test.
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        This will ingest the latest AWIN feed into products_awin.
                    </Typography>
                    <MightyButton
                        startIcon="awin"
                        variant="outlined"
                        disabled={smokeTestLoading}
                        onClick={() => {
                            if (onRunSmokeTest) {
                                onRunSmokeTest();
                                return;
                            }

                            dispatch(navigateTo(router, '/products'));
                        }}
                    >
                        {smokeTestLoading ? 'Ingesting...' : 'Ingest AWIN Feed'}
                    </MightyButton>
                </Stack>
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
                sx={{
                    border: 0,
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
                        outline: 'none',
                    },
                    '& .MuiDataGrid-menuIconButton': {
                        color: 'primary.main',
                        opacity: 1,
                    },
                }}
            />
        </Box>
    ) : null;
}