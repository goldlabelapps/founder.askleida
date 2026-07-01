'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Card,
	CardContent,
	Box,
	Stack,
	Typography,
} from '@mui/material';
import { MightyButton, navigateTo, setFeedback } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import {
	Back,
	ConfirmAction,
	deleteQueueSelection,
	deleteProductQueueRecords,
	deleteProductsRecords,
	fetchAWINFeedIngestPreflight,
	fetchAWINFeedSnapshot,
	setLeida,
} from '../../../Leida';

const QUEUE_COUNT_REFRESH_EVENT = 'leida:queue-count-refresh';
const PRODUCTS_COUNT_REFRESH_EVENT = 'leida:products-count-refresh';

function notifyQueueCountRefresh() {
	window.dispatchEvent(new Event(QUEUE_COUNT_REFRESH_EVENT));
}

function notifyProductsCountRefresh() {
	window.dispatchEvent(new Event(PRODUCTS_COUNT_REFRESH_EVENT));
}

export default function Products() {
	const dispatch = useDispatch();
	const router = useRouter();
	const [queueTotal, setQueueTotal] = React.useState(0);
	const [productsTotal, setProductsTotal] = React.useState(0);
	const [awinTotal, setAWINTotal] = React.useState(0);
	const [hasAWINUpdate, setHasAWINUpdate] = React.useState(false);
	const [updateCheckResult, setUpdateCheckResult] = React.useState<{
		severity: 'success' | 'warning';
		title: string;
		description?: string;
	} | null>(null);
	const [updateRunResult, setUpdateRunResult] = React.useState<{
		severity: 'success' | 'warning';
		title: string;
		description?: string;
	} | null>(null);
	const [confirmDeleteQueueOpen, setConfirmDeleteQueueOpen] = React.useState(false);
	const [deletingQueue, setDeletingQueue] = React.useState(false);
	const [confirmDeleteProductQueueOpen, setConfirmDeleteProductQueueOpen] = React.useState(false);
	const [deletingProductQueue, setDeletingProductQueue] = React.useState(false);
	const [confirmDeleteProductsOpen, setConfirmDeleteProductsOpen] = React.useState(false);
	const [deletingProducts, setDeletingProducts] = React.useState(false);
	const [checkingAWINFeedSnapshot, setCheckingAWINFeedSnapshot] = React.useState(false);
	const [loadingAWINProducts, setLoadingAWINProducts] = React.useState(false);

	React.useEffect(() => {
			dispatch(setLeida('header', {
				title: 'Manage Products',
				icon: 'products',
			}));
	}, [dispatch]);

	const refreshQueueTotal = React.useCallback(async () => {
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
			if (!res.ok) {
				setQueueTotal(0);
				return;
			}

			const nextTotal = typeof json?.data?.total === 'number'
				? json.data.total
				: Array.isArray(json?.data?.rows)
					? json.data.rows.length
					: 0;

			setQueueTotal(nextTotal);
		} catch {
			setQueueTotal(0);
		}
	}, []);

	const refreshAWINTotal = React.useCallback(async () => {
		try {
			const params = new URLSearchParams({
				page: '1',
				limit: '1',
				orderBy: 'created_at',
				orderDir: 'desc',
			});

			const res = await fetch(`/api/awin?${params.toString()}`, {
				method: 'GET',
				headers: { Accept: 'application/json' },
			});

			const json = await res.json().catch(() => null);
			if (!res.ok) {
				setAWINTotal(0);
				return;
			}

			const nextTotal = typeof json?.data?.count === 'number'
				? json.data.count
				: Array.isArray(json?.data?.rows)
					? json.data.rows.length
					: 0;

			setAWINTotal(nextTotal);
		} catch {
			setAWINTotal(0);
		}
	}, []);

	const refreshProductsTotal = React.useCallback(async () => {
		try {
			const params = new URLSearchParams({
				page: '1',
				pageSize: '1',
			});

			const res = await fetch(`/api/products?${params.toString()}`, {
				method: 'GET',
				headers: { Accept: 'application/json' },
			});

			const json = await res.json().catch(() => null);
			if (!res.ok) {
				setProductsTotal(0);
				return;
			}

			const nextTotal = typeof json?.data?.total === 'number'
				? json.data.total
				: Array.isArray(json?.data?.rows)
					? json.data.rows.length
					: 0;

			setProductsTotal(nextTotal);
		} catch {
			setProductsTotal(0);
		}
	}, []);

	React.useEffect(() => {
		refreshQueueTotal();
		refreshAWINTotal();
		refreshProductsTotal();

		const onRefresh = () => {
			refreshQueueTotal();
		};

		const onProductsRefresh = () => {
			refreshProductsTotal();
		};

		window.addEventListener(QUEUE_COUNT_REFRESH_EVENT, onRefresh);
		window.addEventListener(PRODUCTS_COUNT_REFRESH_EVENT, onProductsRefresh);
		return () => {
			window.removeEventListener(QUEUE_COUNT_REFRESH_EVENT, onRefresh);
			window.removeEventListener(PRODUCTS_COUNT_REFRESH_EVENT, onProductsRefresh);
		};
	}, [refreshAWINTotal, refreshProductsTotal, refreshQueueTotal]);

	const handleDeleteQueue = React.useCallback(async () => {
		if (deletingQueue) {
			return;
		}

		setConfirmDeleteQueueOpen(false);
		setDeletingQueue(true);

		try {
			const result = await dispatch(deleteQueueSelection({
				selection: {
					type: 'exclude',
					ids: [],
				},
			}));

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to delete queue items.');
			}

			dispatch(setFeedback({
				severity: 'success',
				title: `Deleted ${result.deletedRows} queue item${result.deletedRows === 1 ? '' : 's'}.`,
			}));
			notifyQueueCountRefresh();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				severity: 'warning',
				title: message || 'Failed to delete queue items.',
			}));
		} finally {
			setDeletingQueue(false);
		}
	}, [deletingQueue, dispatch]);

	const handleDeleteProductQueue = React.useCallback(async () => {
		if (deletingProductQueue) {
			return;
		}

		setConfirmDeleteProductQueueOpen(false);
		setDeletingProductQueue(true);

		try {
			const result = await dispatch(deleteProductQueueRecords());

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to delete product queue records.');
			}

			dispatch(setFeedback({
				severity: 'success',
				title: `Deleted ${result.deletedRows} AWIN record${result.deletedRows === 1 ? '' : 's'}.`,
			}));
			notifyQueueCountRefresh();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				severity: 'error',
				title: message || 'Failed to delete product queue records.',
			}));
		} finally {
			setDeletingProductQueue(false);
			refreshAWINTotal();
		}
	}, [deletingProductQueue, dispatch, refreshAWINTotal]);

	const handleDeleteProducts = React.useCallback(async () => {
		if (deletingProducts) {
			return;
		}

		setConfirmDeleteProductsOpen(false);
		setDeletingProducts(true);

		try {
			const result = await dispatch(deleteProductsRecords());

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to delete product records.');
			}

			dispatch(setFeedback({
				severity: 'success',
				title: `Deleted ${result.deletedRows} product record${result.deletedRows === 1 ? '' : 's'}.`,
			}));
			notifyProductsCountRefresh();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				severity: 'error',
				title: message || 'Failed to delete product records.',
			}));
		} finally {
			setDeletingProducts(false);
			refreshProductsTotal();
		}
	}, [deletingProducts, dispatch, refreshProductsTotal]);

	const handleCheckAWINFeedSnapshot = React.useCallback(async () => {
		if (checkingAWINFeedSnapshot) {
			return;
		}

		setUpdateCheckResult(null);
		setCheckingAWINFeedSnapshot(true);

		try {
			const result = await dispatch(fetchAWINFeedSnapshot());

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to check AWIN feed snapshot.');
			}

			const changed = result.changed;
			const reason = result.reason;
			const latest = result.latest;
			const snapshotId = latest?.id ?? latest?.snapshot_id ?? null;
			const createdAt = latest?.created_at ? String(latest.created_at) : null;
			const storagePath = latest?.storage_path ? String(latest.storage_path) : null;
			const updateRequiredLabel = changed === true
				? 'Yes'
				: changed === false
					? 'No'
					: 'Unknown';
			const updateRequiredSummary = changed === true
				? 'Yes - update needed'
				: changed === false
					? 'No - update not needed'
					: 'Unknown - update status unclear';

			setUpdateCheckResult({
				severity: 'success',
				title: updateRequiredSummary,
				description: [
					`Update required: ${updateRequiredLabel}`,
					result.message || null,
					reason ? `Reason: ${reason}` : null,
					snapshotId !== null ? `Snapshot: ${snapshotId}` : null,
					createdAt ? `Created: ${createdAt}` : null,
					storagePath ? `Path: ${storagePath}` : null,
				].filter(Boolean).join(' | ') || undefined,
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setUpdateCheckResult({
				severity: 'warning',
				title: message || 'Failed to check AWIN feed snapshot.',
			});
		} finally {
			setCheckingAWINFeedSnapshot(false);
		}
	}, [checkingAWINFeedSnapshot, dispatch]);

	const handleLoadAWINProducts = React.useCallback(async () => {
		if (loadingAWINProducts) {
			return;
		}

		setHasAWINUpdate(false);
		setUpdateRunResult(null);
		setLoadingAWINProducts(true);

		try {
			const result = await dispatch(fetchAWINFeedIngestPreflight());

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to load AWIN products.');
			}

			if (result.skippedIngest || result.configured === false) {
				setUpdateRunResult({
					severity: 'warning',
					title: result.message || 'AWIN ingest is not configured.',
					description: 'Run /api/awin/lookfantastic/sync after configuring the feed pipeline, then retry ingest.',
				});
				return;
			}

			const upsertedCount = typeof result.upserted === 'number' ? result.upserted : 0;
			setHasAWINUpdate(upsertedCount > 0);

			setUpdateRunResult({
				severity: 'success',
				title: 'AWIN products updated successfully.',
				description: [
					result.message || null,
					result.rowLimit !== null ? `Limit: ${result.rowLimit}` : null,
					result.csvRows !== null ? `CSV rows: ${result.csvRows}` : null,
					result.upserted !== null ? `Upserted: ${result.upserted}` : null,
					result.skipped !== null ? `Skipped: ${result.skipped}` : null,
				].filter(Boolean).join(' | ') || undefined,
			});

			dispatch(navigateTo(router, '/products/awin'));
		} catch (e: unknown) {
			console.error('[Smoke Test] Products page smoke test failed', e);
			const message = e instanceof Error ? e.message : String(e);
			setUpdateRunResult({
				severity: 'warning',
				title: message || 'Failed to update AWIN products.',
			});
		} finally {
			setLoadingAWINProducts(false);
			refreshAWINTotal();
		}
	}, [dispatch, loadingAWINProducts, refreshAWINTotal, router]);

	return (
		<Box sx={{  }}>
			<Stack spacing={2} alignItems="stretch">
				<Stack direction="row" sx={{ mb: 1 }}>
					<Back />
					<Box sx={{ flexGrow: 1 }} />
				</Stack>
				<Stack spacing={1.5} sx={{ width: '100%' }}>

					<Box sx={{}}>

						<MightyButton
							variant="outlined"
							startIcon="awin"
							onClick={() => {
								dispatch(navigateTo(router, '/products/awin'));
							}}
							>
							Add AWIN Products
						</MightyButton>
						<MightyButton
							alignLeft
							variant="outlined"
							startIcon="awin"
							disabled={checkingAWINFeedSnapshot}
							onClick={handleCheckAWINFeedSnapshot}
						>
							{checkingAWINFeedSnapshot ? 'Running AWIN Cron...' : 'Run AWIN Cron'}
						</MightyButton>
						<Box sx={{ height: 24 }} />
						{updateCheckResult ? (
							<Alert severity="info">
								<Typography variant="body1">
									{updateCheckResult.title}
								</Typography>
								{updateCheckResult.description ? (
									<Typography variant="body2">
										{updateCheckResult.description}
									</Typography>
								) : null}
							</Alert>
						) : null}

					</Box>
					
					<Box sx={{}}>
						<MightyButton
							alignLeft
							variant="outlined"
							startIcon="manage"
							disabled={loadingAWINProducts}
							onClick={handleLoadAWINProducts}
						>
							{loadingAWINProducts ? 'Ingesting...' : 'Ingest AWIN Feed [Smoke Test]'}
						</MightyButton>
					</Box>

					{awinTotal > 0 ? (
						<Box sx={{}}>
							<Typography variant="h6" sx={{ my: 2 }}>
								Permanently clear AWIN table.
							</Typography>
							<MightyButton
								alignLeft
								variant="outlined"
								startIcon="manage"
								disabled={deletingProductQueue}
								onClick={() => setConfirmDeleteProductQueueOpen(true)}
							>
								{deletingProductQueue ? 'Dropping AWIN Table...' : 'Drop AWIN Table'}
							</MightyButton>
						</Box>
					) : null}

					{queueTotal > 0 ? (
						<Box sx={{}}>
							<Typography variant="h6" sx={{ my: 2 }}>
								Permanently clear Queue table.
							</Typography>
							<MightyButton
								alignLeft
								variant="outlined"
								startIcon="manage"
								disabled={deletingQueue}
								onClick={() => setConfirmDeleteQueueOpen(true)}
							>
								{deletingQueue ? 'Dropping Queue Table...' : 'Drop Queue Table'}
							</MightyButton>
						</Box>
					) : null}

					{productsTotal > 0 ? (
						<Box sx={{}}>
							<Typography variant="h6" sx={{ my: 2 }}>
								Permanently clear Products table.
							</Typography>
							<MightyButton
								alignLeft
								variant="outlined"
								startIcon="manage"
								disabled={deletingProducts}
								onClick={() => setConfirmDeleteProductsOpen(true)}
							>
								{deletingProducts ? 'Dropping Products Table...' : 'Drop Products Table'}
							</MightyButton>
						</Box>
					) : null}


					{updateRunResult ? (
						<Box sx={{ pl: 0.5, mb: 2 }}>
							<Typography
								variant="body1"
							>
								{updateRunResult.title}
							</Typography>
							{updateRunResult.description ? (
								<Typography variant="body2" >
									{updateRunResult.description}
								</Typography>
							) : null}
							{hasAWINUpdate ? (
								<Box sx={{ mt: 1.5 }}>
									<MightyButton
										variant="outlined"
										startIcon="awin"
										onClick={() => dispatch(navigateTo(router, '/products/awin'))}
									>
										View Updated AWIN Products
									</MightyButton>
								</Box>
							) : null}
						</Box>
					) : null}
{/* 
					
					 */}
				</Stack>
			</Stack>

			<ConfirmAction
				open={confirmDeleteQueueOpen}
				icon="delete"
				title="Clear everything from the queue?"
				body="This will permanently clear every item currently in the queue."
				handleConfirm={handleDeleteQueue}
				handleClose={() => setConfirmDeleteQueueOpen(false)}
			/>

			<ConfirmAction
				open={confirmDeleteProductQueueOpen}
				icon="delete"
				title="Clear all AWIN products?"
				body="This will permanently clear every record from the AWIN table."
				handleConfirm={handleDeleteProductQueue}
				handleClose={() => setConfirmDeleteProductQueueOpen(false)}
			/>

			<ConfirmAction
				open={confirmDeleteProductsOpen}
				icon="delete"
				title="Clear all products?"
				body="This will permanently clear every record from the products table."
				handleConfirm={handleDeleteProducts}
				handleClose={() => setConfirmDeleteProductsOpen(false)}
			/>
		</Box>
	);
}
