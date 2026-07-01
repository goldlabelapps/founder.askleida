'use client';
import * as React from 'react';
import {useRouter} from 'next/navigation';
import {
	Box,
	Button,
	LinearProgress,
	Stack,
	Typography,
} from '@mui/material';
import {
	DataGrid,
	type GridColDef,
	type GridRenderCellParams,
	type GridSortModel,
} from '@mui/x-data-grid';
import { setFeedback, navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import {
	formatUkPrice,
	getProductCategoryLabel,
	getProductName,
	getProductPrice,
	getProductUpdatedAt,
	Editable,
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
	const router = useRouter();
	const dispatch = useDispatch();
	const [products, setProducts] = React.useState<T_Product[]>([]);
	const [total, setTotal] = React.useState(0);
	const [page, setPage] = React.useState(1);
	const [searchTerm, setSearchTerm] = React.useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
	const [resultsPerPage, setResultsPerPage] = React.useState(100);
	const [sortModel, setSortModel] = React.useState<GridSortModel>([
		{ field: 'updated', sort: 'desc' },
	]);
	const [loading, setLoading] = React.useState(false);
	const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [queueTotal, setQueueTotal] = React.useState(0);
	const [refreshNonce, setRefreshNonce] = React.useState(0);
	const lastSearchFeedbackKeyRef = React.useRef('');

	React.useEffect(() => {
		dispatch(initProducts());
	}, [dispatch]);

	const activeSort = sortModel[0] || { field: 'updated', sort: 'desc' as const };
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

	const totalPages = Math.max(1, Math.ceil(total / resultsPerPage));
	const activeQuery = debouncedSearchTerm.trim();
	const isResolvingInitialProducts = !hasLoadedOnce && !error;
	const showEmptyLibraryState = !loading && !error && hasLoadedOnce && !activeQuery && total === 0;

	React.useEffect(() => {
		dispatch(setLeida('header', {
			title: 'Products',
			icon: 'products',
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
		if (!activeQuery) {
			lastSearchFeedbackKeyRef.current = '';
			return;
		}

		if (error || !hasLoadedOnce) {
			return;
		}

		const feedbackKey = loading
			? `loading:${activeQuery}`
			: total === 0
				? `empty:${activeQuery}`
				: `results:${activeQuery}:${total}`;

		if (lastSearchFeedbackKeyRef.current === feedbackKey) {
			return;
		}

		lastSearchFeedbackKeyRef.current = feedbackKey;
		dispatch(setFeedback({
			severity: 'info',
			title: loading
				? `Searching for "${activeQuery}"...`
				: total === 0
					? `Nothing found for "${activeQuery}"`
					: `${total} results for "${activeQuery}".`,
		}));
	}, [activeQuery, dispatch, error, hasLoadedOnce, loading, total]);

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
				dispatch(setFeedback({
					severity: 'warning',
					title: message || 'Products query failed',
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
	}, [debouncedSearchTerm, dispatch, page, refreshNonce, resultsPerPage, sortBy, sortOrder]);

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

	React.useEffect(() => {
		if (!showEmptyLibraryState) {
			return;
		}

		let cancelled = false;

		const run = async () => {
			try {
				const params = new URLSearchParams({
					page: '1',
					pageSize: '1',
					sortBy: 'created',
					sortOrder: 'asc',
					status: 'pending',
				});

				const res = await fetch(`/api/products/queue?${params.toString()}`, {
					method: 'GET',
					headers: { Accept: 'application/json' },
				});

				const json = await res.json().catch(() => null);
				if (!res.ok || cancelled) {
					return;
				}

				const totalFromApi = typeof json?.data?.total === 'number'
					? json.data.total
					: Array.isArray(json?.data?.rows)
						? json.data.rows.length
						: 0;

				setQueueTotal(totalFromApi);
			} catch {
				if (!cancelled) {
					setQueueTotal(0);
				}
			}
		};

		run();

		return () => {
			cancelled = true;
		};
	}, [showEmptyLibraryState]);

	const columns = React.useMemo<GridColDef[]>(() => {
		return [
			{
				field: 'title',
				headerName: '',
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
			{isResolvingInitialProducts ? (
				<LinearProgress />
			) : showEmptyLibraryState ? (
				<Box sx={{ py: 4 }}>
					<Typography variant="body1" color="text.secondary">
						No products yet.
					</Typography>

					<Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
						<MightyButton
							variant="outlined"
							startIcon="manage"
							onClick={() => {
								dispatch(navigateTo(router, '/products/manage'));
							}}
						>
							Manage
						</MightyButton>

						{queueTotal > 0 ? (
							<MightyButton
								variant="outlined"
								startIcon="queue"
								onClick={() => {
									dispatch(navigateTo(router, '/products/queue'));
								}}
							>
								Queue
							</MightyButton>
						) : null}
					</Stack>
				</Box>
			) : (
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
					<Box sx={{ width: { xs: '100%', md: 380 }, maxWidth: '100%', ml: { md: 'auto' } }}>
						<Editable
							variant="standard"
							placeholder="Search products"
							value={searchTerm}
							onChange={(value: string) => {
								setPage(1);
								setSearchTerm(value);
							}}
							startAdornment={'search'}
							endAdornment={(
								<MightyButton
									kind="icon"
									icon="cancel"
									disabled={!searchTerm.trim()}
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
			)}

			{loading || rows.length > 0 ? (
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
						onCellClick={(params) => {
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
			) : null}
		</Stack>
	);
};

export default ListProducts;