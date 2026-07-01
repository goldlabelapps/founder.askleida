'use client';
import * as React from 'react';
import {useRouter} from 'next/navigation';
import {
	Box,
	Dialog,
	DialogContent,
	DialogTitle,
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
import { MightyButton, setFeedback, navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import {
	formatUkPrice,
	getProductImageUrl,
	getProductCategoryLabel,
	getProductName,
	getProductPrice,
	getProductUpdatedAt,
	Editable,
	fetchProducts,
	initProducts,
	Thumbnail,
	setLeida
} from '../../../../Leida';
import { LEIDA_DATA_GRID_SX } from '../../UI';
import type { T_ListProductsProps, T_Product } from '../../../types.d';


const RESULTS_PER_PAGE_OPTIONS = [5, 10, 25, 50, 100];
const SEARCH_DEBOUNCE_MS = 350;
const PRODUCTS_COUNT_REFRESH_EVENT = 'leida:products-count-refresh';

type T_ProductListRow = {
	id: string;
	thumbnailUrl: string | null;
	title: string;
	category: string | null;
	status: string | null;
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
	const [previewProduct, setPreviewProduct] = React.useState<T_Product | null>(null);
	const lastSearchFeedbackKeyRef = React.useRef('');

	const openProductPreview = React.useCallback((product: T_Product) => {
		onProductSelect?.(product);
		setPreviewProduct(product);
	}, [onProductSelect]);

	const previewText = React.useMemo(() => {
		if (!previewProduct) {
			return '';
		}

		try {
			return JSON.stringify(previewProduct, null, 2);
		} catch {
			return '{\n  "error": "Unable to stringify product"\n}';
		}
	}, [previewProduct]);

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
			case 'title':
				return 'slug';
			default:
				return 'slug';
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
			const data = product?.data && typeof product.data === 'object' && !Array.isArray(product.data)
				? (product.data as Record<string, unknown>)
				: null;
			const status = typeof product?.status === 'string' && product.status.trim()
				? product.status.trim()
				: typeof data?.status === 'string' && data.status.trim()
					? data.status.trim()
					: null;

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
				thumbnailUrl: getProductImageUrl(product),
				title: getProductName(product),
				category: getProductCategoryLabel(product),
				status,
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
				field: 'thumbnailUrl',
				headerName: '',
				width: 72,
				sortable: false,
				filterable: false,
				disableColumnMenu: true,
				renderCell: (params: GridRenderCellParams) => (
					<Thumbnail
						src={typeof params.value === 'string' ? params.value : null}
						alt="Product thumbnail"
						size={40}
					/>
				),
			},
			{
				field: 'title',
				headerName: '',
				flex: 1.6,
				minWidth: 280,
				sortable: true,
				renderCell: (params: GridRenderCellParams) => (
					<Box sx={{ width: '100%', cursor: 'pointer' }}>
						<Typography variant="h6" sx={{ mt: 1, lineHeight: 1.2, cursor: 'pointer' }}>
							{params.value}
						</Typography>
					</Box>
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
				field: 'status',
				headerName: 'Status',
				width: 140,
				sortable: false,
				renderCell: (params: GridRenderCellParams) => (
					<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
						{typeof params.value === 'string' && params.value.trim() ? params.value : 'n/a'}
					</Typography>
				),
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
		];
	}, [openProductPreview]);

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
					<Box sx={{display: 'flex'}}>
						<Box>
							<Editable
								variant="standard"
								value={searchTerm}
								onChange={(value: string) => {
									setPage(1);
									setSearchTerm(value);
								}}
								startAdornment={'search'}
								endAdornment={(
									<MightyButton
										kind="icon"
										icon="close"
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
					<Box sx={{ flexGrow: 1 }} />
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
							openProductPreview(params.row.product as T_Product);
						}}
						sx={LEIDA_DATA_GRID_SX}
					/>
				</Box>
			) : null}

			<Dialog
				open={Boolean(previewProduct)}
				onClose={() => setPreviewProduct(null)}
				fullWidth
				maxWidth="md"
			>
				<DialogTitle>Product JSON</DialogTitle>
				<DialogContent>
					<Box
						component="pre"
						sx={{
							m: 0,
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
							fontSize: '0.8rem',
						}}
					>
						{previewText}
					</Box>
				</DialogContent>
			</Dialog>
		</Stack>
	);
};

export default ListProducts;