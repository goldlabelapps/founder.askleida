'use client';
import * as React from 'react';
import {
	Box,
	IconButton,
	LinearProgress,
	Menu,
	MenuItem,
	Pagination,
	Stack,
	Typography,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { Icon } from '../../../../NX/DesignSystem';
import {
	setAwin,
	useAwin,
} from '../../../../Leida';
import {
    Editable,
} from '../../../../NX/NXAdmin';
import type { T_AwinOrderBy } from '../../../types';

const RESULTS_PER_PAGE_OPTIONS = [1, 5, 10, 25, 50, 100] as const;

const ORDER_BY_OPTIONS: Array<{ value: T_AwinOrderBy; label: string }> = [
	{ value: 'search_price', label: 'Price' },
	{ value: 'product_name', label: 'Name' },
	{ value: 'brand', label: 'Brand' },
];

const ORDER_DIR_OPTIONS: Array<{ value: 'asc' | 'desc'; label: string }> = [
	{ value: 'asc', label: 'Asc' },
	{ value: 'desc', label: 'Desc' },
];

const SEARCH_DEBOUNCE_MS = 350;

export default function Query() {
	const dispatch = useDispatch();
	const awin = useAwin();

	const [page, setPage] = React.useState(1);
	const [searchTerm, setSearchTerm] = React.useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
	const [resultsPerPage, setResultsPerPage] = React.useState<number>(10);
	const [orderBy, setOrderBy] = React.useState<T_AwinOrderBy>('product_name');
	const [orderDir, setOrderDir] = React.useState<'asc' | 'desc'>('desc');
	const [loading, setLoading] = React.useState(false);
	const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [resultsAnchorEl, setResultsAnchorEl] = React.useState<null | HTMLElement>(null);
	const [sortAnchorEl, setSortAnchorEl] = React.useState<null | HTMLElement>(null);
	const [orderAnchorEl, setOrderAnchorEl] = React.useState<null | HTMLElement>(null);

	const total = typeof awin?.count === 'number' ? awin.count : 0;
	const renderedCount = Array.isArray(awin?.products) ? awin.products.length : 0;
	const defaultResultsPerPage = 5;
	const defaultOrderBy: T_AwinOrderBy = 'product_name';
	const defaultOrderDir: 'asc' | 'desc' = 'desc';
	const totalPages = Math.max(1, Math.ceil(total / resultsPerPage));
	const sortByLabel = ORDER_BY_OPTIONS.find((option) => option.value === orderBy)?.label || 'Sort';
	const orderDirLabel = ORDER_DIR_OPTIONS.find((option) => option.value === orderDir)?.label || 'Order';
    const activeQuery = debouncedSearchTerm.trim();

	const statusMessage = React.useMemo(() => {
		if (loading) {
			return `Searching for ${activeQuery ? `"${activeQuery}"` : 'all products'}...`;
		}

		if (!hasLoadedOnce) {
			return 'Ready to search';
		}

		if (total === 0 && activeQuery) {
			return `Nothing found for "${activeQuery}"`;
		}

		const queryText = activeQuery ? ` for "${activeQuery}"` : '';
		const parts: string[] = [];

		if (page > 1 || totalPages > 1) {
			parts.push(`page ${page} of ${totalPages}`);
		}

		if (resultsPerPage !== defaultResultsPerPage) {
			parts.push(`${resultsPerPage} per page`);
		}

		if (orderBy !== defaultOrderBy || orderDir !== defaultOrderDir) {
			parts.push(`ordered by ${sortByLabel} ${orderDirLabel.toLowerCase()}`);
		}

		if (activeQuery) {
			parts.push(`title contains "${activeQuery}"`);
		}

		const suffix = parts.length ? ` (${parts.join(', ')})` : '';
		return `${total} results${queryText}${suffix}.`;
	}, [
		activeQuery,
		hasLoadedOnce,
		loading,
		orderBy,
		orderDir,
		orderDirLabel,
		page,
		resultsPerPage,
		sortByLabel,
		total,
		totalPages,
	]);

	React.useEffect(() => {
		if (page > totalPages) {
			setPage(totalPages);
		}
	}, [page, totalPages]);

	React.useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [searchTerm]);

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
			await dispatch(setAwin('rows', []));
			await dispatch(setAwin('products', []));
			await dispatch(setAwin('scanned', 0));

			try {
				const res = await fetch(route, {
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				});

				const json = await res.json().catch(() => null);

				if (!res.ok) {
					const msg = json?.message || `Failed to fetch AWIN results (${res.status})`;
					throw new Error(msg);
				}

				const data = json?.data || {};
				const rows = Array.isArray(data?.rows) ? data.rows : [];
				const count = typeof data?.count === 'number' ? data.count : rows.length;

				if (cancelled) return;

				await dispatch(setAwin('rows', rows));
				await dispatch(setAwin('products', rows));
				await dispatch(setAwin('count', count));
				await dispatch(setAwin('scanned', rows.length));
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
				if (cancelled) return;
				const msg = e instanceof Error ? e.message : String(e);
				setError(msg || 'AWIN query failed');
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
	}, [dispatch, orderBy, orderDir, page, resultsPerPage, debouncedSearchTerm]);

	return (
		<>
            <Box sx={{ height: 8 }}>
				{loading ? <LinearProgress /> : null}
            </Box>  
			{!loading ? (
				<>
					<Stack direction="row" justifyContent="center">
						<Box sx={{ mt: 1 }}>
							<Pagination
								page={page}
								count={totalPages}
								color="primary"
								shape="rounded"
								onChange={(_event, value) => setPage(value)}
							/>
						</Box>
						<Box sx={{ mt: 0.5 }}>
							<IconButton
								size="small"
								onClick={(event) => setResultsAnchorEl(event.currentTarget)}
								aria-label={`Results per page (${resultsPerPage})`}
							>
								<Icon icon="spy" />
							</IconButton>

							<IconButton
								size="small"
								onClick={(event) => setSortAnchorEl(event.currentTarget)}
								aria-label={`Sort by (${sortByLabel})`}
							>
								<Icon icon="filter" />
							</IconButton>

							<IconButton
								size="small"
								onClick={(event) => setOrderAnchorEl(event.currentTarget)}
								aria-label={`Order direction (${orderDirLabel})`}
							>
								<Icon icon={orderDir === 'asc' ? 'up' : 'down'} />
							</IconButton>
						</Box>
					</Stack>

					<Box sx={{ flex: 1 }}>
						<Box>
							<Editable
								placeholder="Search"
								value={searchTerm}
								onChange={(nextValue) => {
									setPage(1);
									setSearchTerm(nextValue);
								}}
								startAdornment="search"
							/>
						</Box>
					</Box>

					<Menu
						anchorEl={resultsAnchorEl}
						open={Boolean(resultsAnchorEl)}
						onClose={() => setResultsAnchorEl(null)}
					>
						{RESULTS_PER_PAGE_OPTIONS.map((option) => (
							<MenuItem
								key={option}
								selected={resultsPerPage === option}
								onClick={() => {
									setPage(1);
									setResultsPerPage(option);
									setResultsAnchorEl(null);
								}}
							>
								{option}
							</MenuItem>
						))}
					</Menu>

					<Menu
						anchorEl={sortAnchorEl}
						open={Boolean(sortAnchorEl)}
						onClose={() => setSortAnchorEl(null)}
					>
						{ORDER_BY_OPTIONS.map((option) => (
							<MenuItem
								key={option.value}
								selected={orderBy === option.value}
								onClick={() => {
									setPage(1);
									setOrderBy(option.value as T_AwinOrderBy);
									setSortAnchorEl(null);
								}}
							>
								{option.label}
							</MenuItem>
						))}
					</Menu>

					<Menu
						anchorEl={orderAnchorEl}
						open={Boolean(orderAnchorEl)}
						onClose={() => setOrderAnchorEl(null)}
					>
						{ORDER_DIR_OPTIONS.map((option) => (
							<MenuItem
								key={option.value}
								selected={orderDir === option.value}
								onClick={() => {
									setPage(1);
									setOrderDir(option.value);
									setOrderAnchorEl(null);
								}}
							>
								{option.label}
							</MenuItem>
						))}
					</Menu>
				</>
			) : null}
                
                <Typography variant="caption" align="center">
                    {statusMessage}
                </Typography>
                
				{error ? (
					<Typography variant="body2" color="error.main">
						{error}
					</Typography>
				) : null}
		</>
	);
}
