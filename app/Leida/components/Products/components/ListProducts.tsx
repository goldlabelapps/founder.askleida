'use client';
import * as React from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Stack,
	Typography,
} from '@mui/material';
import {
	DataGrid,
	type GridColDef,
	type GridRenderCellParams,
	type GridRowSelectionModel,
	type GridSortModel,
} from '@mui/x-data-grid';
import { useDispatch } from '../../../../NX/Uberedux';
import {
	formatUkPrice,
	getProductCategoryLabel,
	getProductName,
	getProductPrice,
	getProductUpdatedAt,
	Editable,
	ConfirmAction,
	fetchProducts,
	initProducts,
	MightyButton,
	setLeida
} from '../../../../Leida';
import type { T_ListProductsProps, T_Product } from '../../../types.d';


const RESULTS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 350;
const PRODUCTS_COUNT_REFRESH_EVENT = 'leida:products-count-refresh';

type T_ProductListRow = {
	id: string;
	title: string;
	category: string | null;
	price: number | null;
	updated: string | number | null;
	product: T_Product;
};

function notifyProductsCountRefresh() {
	window.dispatchEvent(new Event(PRODUCTS_COUNT_REFRESH_EVENT));
}

const ListProducts = ({
	onVisibleProductsChange,
	onProductSelect,
}: T_ListProductsProps) => {
	const dispatch = useDispatch();
	const [products, setProducts] = React.useState<T_Product[]>([]);
	const [total, setTotal] = React.useState(0);
	const [page, setPage] = React.useState(1);
	const [searchTerm, setSearchTerm] = React.useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
	const [resultsPerPage, setResultsPerPage] = React.useState(10);
	const [sortModel, setSortModel] = React.useState<GridSortModel>([
		{ field: 'title', sort: 'asc' },
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
	const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);
	const [refreshNonce, setRefreshNonce] = React.useState(0);

	React.useEffect(() => {
		dispatch(initProducts());
	}, [dispatch]);

	const activeSort = sortModel[0] || { field: 'title', sort: 'asc' as const };
	const sortBy = (() => {
		switch (activeSort.field) {
			case 'created':
				return 'created';
			case 'updated':
				return 'updated';
			default:
				return 'title';
		}
	})();
	const sortOrder = activeSort.sort === 'desc' ? 'desc' : 'asc';

	const selectedCount = React.useMemo(() => {
		if (selectionModel.type === 'exclude') {
			return Math.max(total - selectionModel.ids.size, 0);
		}

		return selectionModel.ids.size;
	}, [selectionModel, total]);

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

	const handleDeleteConfirm = React.useCallback(async () => {
		if (!selectedCount || deleting) {
			setConfirmDeleteOpen(false);
			return;
		}

		setConfirmDeleteOpen(false);
		setDeleting(true);
		setBulkError(null);
		setSuccessMessage(null);

		try {
			const res = await fetch('/api/products', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					q: debouncedSearchTerm.trim(),
					selection: {
						type: selectionModel.type,
						ids: Array.from(selectionModel.ids).map((value) => String(value)),
					},
				}),
			});

			const json = await res.json().catch(() => null);

			if (!res.ok) {
				const message = json?.message || `Failed to delete selected products (${res.status})`;
				throw new Error(message);
			}

			const deletedCount = typeof json?.data?.deletedRows === 'number'
				? json.data.deletedRows
				: selectedCount;

			setSuccessMessage(`Deleted ${deletedCount} product${deletedCount === 1 ? '' : 's'} from the products table.`);
			setSelectionModel({
				type: 'include',
				ids: new Set<string>(),
			});
			setRefreshNonce((value) => value + 1);
			notifyProductsCountRefresh();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setBulkError(message || 'Failed to delete selected products.');
		} finally {
			setDeleting(false);
		}
	}, [debouncedSearchTerm, deleting, selectedCount, selectionModel]);

	React.useEffect(() => {
		dispatch(setLeida('header', {
			title: 'Leida Products',
			icon: 'list',
		}));
	}, [dispatch]);

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
			setError(null);

			try {
				const result = await dispatch(fetchProducts({
					page,
					pageSize: resultsPerPage,
					sortBy,
					sortOrder,
					q: debouncedSearchTerm,
				}));

				if (cancelled) {
					return;
				}

				if (!result?.ok) {
					throw new Error(result?.error || 'Products query failed');
				}

				setProducts(Array.isArray(result.rows) ? result.rows as T_Product[] : []);
				setTotal(typeof result.total === 'number' ? result.total : 0);
				setHasLoadedOnce(true);
			} catch (e: unknown) {
				if (cancelled) {
					return;
				}
				const message = e instanceof Error ? e.message : String(e);
				setError(message || 'Products query failed');
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
	}, [debouncedSearchTerm, page, refreshNonce, resultsPerPage, sortBy, sortOrder]);

	const rows = React.useMemo<T_ProductListRow[]>(() => {
		return products.map((product, index) => {
			const productId = typeof product?.product_id === 'string' && product.product_id
				? product.product_id
				: (typeof product?.product_id === 'number' && Number.isFinite(product.product_id)
					? String(Math.floor(product.product_id))
					: '');
			const fallbackId = typeof product?.id === 'string' && product.id
				? product.id
				: (typeof product?.id === 'number' && Number.isFinite(product.id)
					? String(Math.floor(product.id))
					: `product-row-${index}`);
			const id = productId || fallbackId;
			const numericPrice = Number(getProductPrice(product));

			return {
				id,
				title: getProductName(product),
				category: getProductCategoryLabel(product),
				price: Number.isFinite(numericPrice) ? numericPrice : null,
				updated: getProductUpdatedAt(product),
				product,
			};
		});
	}, [products]);

	React.useEffect(() => {
		onVisibleProductsChange?.(products);
	}, [products, onVisibleProductsChange]);

	const columns = React.useMemo<GridColDef[]>(() => {
		return [
			{
				field: 'title',
				headerName: 'Title',
				flex: 1.6,
				minWidth: 280,
				sortable: true,
				renderCell: (params: GridRenderCellParams) => (
					<Button
						variant="text"
						sx={{ justifyContent: 'flex-start', textTransform: 'none', px: 0 }}
						onClick={() => {
							onProductSelect?.(params.row.product as T_Product);
						}}
					>
						{params.value}
					</Button>
				),
			},
			{
				field: 'category',
				headerName: 'Category',
				flex: 1,
				minWidth: 180,
				sortable: false,
			},
			{
				field: 'price',
				headerName: 'Price',
				width: 140,
				sortable: false,
				align: 'right',
				headerAlign: 'right',
				renderCell: (params: GridRenderCellParams) => formatUkPrice(typeof params.value === 'number' ? params.value : null),
			},
			{
				field: 'updated',
				headerName: 'Updated',
				width: 180,
				sortable: true,
			},
		];
	}, [onProductSelect]);

	return (
		<Stack spacing={2}>
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
				<Box sx={{ width: { xs: '100%', md: 380 }, maxWidth: '100%' }}>
					<Editable
						variant="outlined"
						placeholder="Search products"
						value={searchTerm}
						onChange={(value: string) => {
							setPage(1);
							setSearchTerm(value);
						}}
						disabled={deleting}
						startAdornment={'search'}
					/>
				</Box>
				<MightyButton
					kind="icon"
					icon="reset"
					disabled={!searchTerm.trim() || deleting}
					onClick={() => {
						setPage(1);
						setSearchTerm('');
						setDebouncedSearchTerm('');
					}}
				/>
				<Button
					variant="outlined"
					color="error"
					disabled={!selectedCount || deleting}
					onClick={() => setConfirmDeleteOpen(true)}
				>
					{deleting ? <CircularProgress size={18} color="inherit" /> : `Delete${selectedCount ? ` (${selectedCount})` : ''}`}
				</Button>
			</Stack>

			<Typography variant="body2" color="text.secondary">
				{statusMessage}
			</Typography>

			{error ? <Alert severity="warning">{error}</Alert> : null}
			{deleting ? <Alert severity="warning">Deleting selected products...</Alert> : null}
			{bulkError ? <Alert severity="warning">{bulkError}</Alert> : null}
			{successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

			{!loading && !error && rows.length === 0 ? (
				<Alert severity="info">No products found.</Alert>
			) : null}

			<Box sx={{ width: '100%', minHeight: 560 }}>
				<DataGrid
					rows={rows}
					columns={columns}
					initialState={{
						columns: {
							columnVisibilityModel: {
								category: false,
								price: false,
								updated: false,
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
							: [{ field: 'title', sort: 'asc' as const }];
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

						if (nextSelection.type === 'include' && nextIds.size > 0) {
							const firstId = Array.from(nextIds)[0];
							const selectedRow = rows.find((row) => row.id === firstId);
							if (selectedRow) {
								onProductSelect?.(selectedRow.product);
							}
						}
					}}
					onCellClick={(params) => {
						if (params.field === '__check__') {
							return;
						}
						onProductSelect?.(params.row.product as T_Product);
					}}
					sx={{
						border: 0,
						'& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
							outline: 'none',
						},
					}}
				/>
			</Box>

			<ConfirmAction
				open={confirmDeleteOpen}
				icon="delete"
				title="Delete selected products?"
				body={`This will permanently delete ${selectedCount} product${selectedCount === 1 ? '' : 's'} from the products table.`}
				handleConfirm={handleDeleteConfirm}
				handleClose={() => setConfirmDeleteOpen(false)}
			/>
		</Stack>
	);
};

export default ListProducts;