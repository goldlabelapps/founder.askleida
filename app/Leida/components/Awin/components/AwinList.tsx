'use client';
import * as React from 'react';
import type { T_AwinListProps, T_AwinProduct } from '../../../types.d';
import { Box, Button, IconButton, SvgIcon, Typography } from '@mui/material';
import {
    DataGrid,
    type GridColDef,
    type GridRenderCellParams,
} from '@mui/x-data-grid';
import { formatUkPrice } from '../../../../Leida';
import { Icon } from '../../../../NX/DesignSystem';

export default function AwinList({
    rows,
    loading,
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
}: T_AwinListProps) {
    const columns = React.useMemo<GridColDef[]>(() => {
        return [
            {
                field: 'product_name',
                headerName: 'Title',
                flex: 1.6,
                minWidth: 260,
                sortable: true,
                renderCell: (params: GridRenderCellParams) => (
                    <Button
                        variant="text"
                        sx={{ justifyContent: 'flex-start', textTransform: 'none', px: 0 }}
                        onClick={() => {
                            onOpenProduct(params.row.product as T_AwinProduct, String(params.row.id));
                        }}
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

    return (
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
                sx={{
                    border: 0,
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
                        outline: 'none',
                    },
                }}
            />
        </Box>
    );
}