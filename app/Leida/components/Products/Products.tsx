'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Card,
	CardContent,
	Box,
	Stack,
	Typography,
} from '@mui/material';
import { navigateTo, setFeedback } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import {
	ConfirmAction,
	deleteQueueSelection,
	deleteProductQueueRecords,
	fetchAwinFeedIngestPreflight,
	fetchAwinFeedSnapshot,
	MightyButton,
	setLeida,
} from '../../../Leida';

const QUEUE_COUNT_REFRESH_EVENT = 'leida:queue-count-refresh';

function notifyQueueCountRefresh() {
	window.dispatchEvent(new Event(QUEUE_COUNT_REFRESH_EVENT));
}

export default function Products() {
	const dispatch = useDispatch();
	const router = useRouter();
	const [queueTotal, setQueueTotal] = React.useState(0);
	const [awinTotal, setAwinTotal] = React.useState(0);
	const [hasAwinUpdate, setHasAwinUpdate] = React.useState(false);
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
	const [checkingAwinFeedSnapshot, setCheckingAwinFeedSnapshot] = React.useState(false);
	const [loadingAwinProducts, setLoadingAwinProducts] = React.useState(false);

	React.useEffect(() => {
			dispatch(setLeida('header', {
				title: 'Products',
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

	const refreshAwinTotal = React.useCallback(async () => {
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
				setAwinTotal(0);
				return;
			}

			const nextTotal = typeof json?.data?.count === 'number'
				? json.data.count
				: Array.isArray(json?.data?.rows)
					? json.data.rows.length
					: 0;

			setAwinTotal(nextTotal);
		} catch {
			setAwinTotal(0);
		}
	}, []);

	React.useEffect(() => {
		refreshQueueTotal();
		refreshAwinTotal();

		const onRefresh = () => {
			refreshQueueTotal();
		};

		window.addEventListener(QUEUE_COUNT_REFRESH_EVENT, onRefresh);
		return () => {
			window.removeEventListener(QUEUE_COUNT_REFRESH_EVENT, onRefresh);
		};
	}, [refreshAwinTotal, refreshQueueTotal]);

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
				title: `Deleted ${result.deletedRows} Awin record${result.deletedRows === 1 ? '' : 's'}.`,
			}));
			notifyQueueCountRefresh();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				severity: 'warning',
				title: message || 'Failed to delete product queue records.',
			}));
		} finally {
			setDeletingProductQueue(false);
			refreshAwinTotal();
		}
	}, [deletingProductQueue, dispatch, refreshAwinTotal]);

	const handleCheckAwinFeedSnapshot = React.useCallback(async () => {
		if (checkingAwinFeedSnapshot) {
			return;
		}

		setUpdateCheckResult(null);
		setCheckingAwinFeedSnapshot(true);

		try {
			const result = await dispatch(fetchAwinFeedSnapshot());

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to check Awin feed snapshot.');
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
				title: message || 'Failed to check Awin feed snapshot.',
			});
		} finally {
			setCheckingAwinFeedSnapshot(false);
		}
	}, [checkingAwinFeedSnapshot, dispatch]);

	const handleLoadAwinProducts = React.useCallback(async () => {
		if (loadingAwinProducts) {
			return;
		}

		setHasAwinUpdate(false);
		setUpdateRunResult(null);
		setLoadingAwinProducts(true);

		try {
			const result = await dispatch(fetchAwinFeedIngestPreflight());

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to load Awin products.');
			}

			const upsertedCount = typeof result.upserted === 'number' ? result.upserted : 0;
			setHasAwinUpdate(upsertedCount > 0);

			setUpdateRunResult({
				severity: 'success',
				title: 'Awin products updated successfully.',
				description: [
					result.message || null,
					result.rowLimit !== null ? `Limit: ${result.rowLimit}` : null,
					result.csvRows !== null ? `CSV rows: ${result.csvRows}` : null,
					result.upserted !== null ? `Upserted: ${result.upserted}` : null,
					result.skipped !== null ? `Skipped: ${result.skipped}` : null,
				].filter(Boolean).join(' | ') || undefined,
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setUpdateRunResult({
				severity: 'warning',
				title: message || 'Failed to update Awin products.',
			});
		} finally {
			setLoadingAwinProducts(false);
			refreshAwinTotal();
		}
	}, [dispatch, loadingAwinProducts, refreshAwinTotal]);

	return (
		<Box sx={{  }}>
			<Stack spacing={2} alignItems="stretch">
				<Stack spacing={1.5} sx={{ width: '100%' }}>

					<Box sx={{
						// border: '1px solid ',
						// borderColor: '#b2d612',
					}}>
						<MightyButton
							fullWidth
							alignLeft
							variant="outlined"
							startIcon="awin"
							disabled={checkingAwinFeedSnapshot}
							onClick={handleCheckAwinFeedSnapshot}
						>
							{checkingAwinFeedSnapshot ? 'Checking Awin...' : 'Cron Awin check'}
						</MightyButton>
					</Box>
					
					{updateCheckResult ? (
						<Box sx={{}}>
							<Typography
								variant="body1"
							>
								{updateCheckResult.title}
							</Typography>
							{updateCheckResult.description ? (
								<Typography variant="body2">
									{updateCheckResult.description}
								</Typography>
							) : null}
						</Box>
					) : null}

					<Box sx={{}}>
						<MightyButton
							fullWidth
							alignLeft
							variant="outlined"
							startIcon="warning"
							disabled={loadingAwinProducts}
							onClick={handleLoadAwinProducts}
						>
							{loadingAwinProducts ? 'Smoke Testing...' : 'Smoke Test'}
						</MightyButton>
					</Box>

					{awinTotal > 0 ? (
						<Box sx={{}}>
							<MightyButton
								fullWidth
								alignLeft
								variant="outlined"
								startIcon="warning"
								disabled={deletingProductQueue}
								onClick={() => setConfirmDeleteProductQueueOpen(true)}
							>
								{deletingProductQueue ? 'Dropping Awin...' : 'Drop Awin'}
							</MightyButton>
						</Box>
					) : null}

					{queueTotal > 0 ? (
						<Box sx={{
							// border: '1px solid ',
							// borderColor: '#d612b5',
						}}>
							<MightyButton
								fullWidth
								alignLeft
								variant="outlined"
								startIcon="warning"
								disabled={deletingQueue}
								onClick={() => setConfirmDeleteQueueOpen(true)}
							>
								{deletingQueue ? 'Dropping Queue...' : 'Drop Queue'}
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
							{hasAwinUpdate ? (
								<Box sx={{ mt: 1.5 }}>
									<MightyButton
										variant="outlined"
										startIcon="awin"
										onClick={() => dispatch(navigateTo(router, '/products/awin'))}
									>
										View Updated Awin Products
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
				title="Clear all Awin products?"
				body="This will permanently clear every record from the Awin table."
				handleConfirm={handleDeleteProductQueue}
				handleClose={() => setConfirmDeleteProductQueueOpen(false)}
			/>
		</Box>
	);
}
