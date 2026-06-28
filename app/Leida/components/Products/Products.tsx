'use client';

import * as React from 'react';
import {
	Card,
	CardContent,
	Box,
	Stack,
	Typography,
} from '@mui/material';
import { setFeedback } from '../../../NX/DesignSystem';
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
		}
	}, [deletingProductQueue, dispatch]);

	const handleCheckAwinFeedSnapshot = React.useCallback(async () => {
		if (checkingAwinFeedSnapshot) {
			return;
		}

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

			dispatch(setFeedback({
				severity: changed === false ? 'success' : 'success',
				title: 'Awin feed snapshot checked successfully.',
				description: [
					result.message || null,
					reason ? `Reason: ${reason}` : null,
					snapshotId !== null ? `Snapshot: ${snapshotId}` : null,
					createdAt ? `Created: ${createdAt}` : null,
					storagePath ? `Path: ${storagePath}` : null,
				].filter(Boolean).join(' | ') || undefined,
			}));
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				severity: 'warning',
				title: message || 'Failed to check Awin feed snapshot.',
			}));
		} finally {
			setCheckingAwinFeedSnapshot(false);
		}
	}, [checkingAwinFeedSnapshot, dispatch]);

	const handleLoadAwinProducts = React.useCallback(async () => {
		if (loadingAwinProducts) {
			return;
		}

		setLoadingAwinProducts(true);

		try {
			const result = await dispatch(fetchAwinFeedIngestPreflight());

			if (!result?.ok) {
				throw new Error(result?.error || 'Failed to load Awin products.');
			}

			dispatch(setFeedback({
				severity: 'success',
				title: 'Awin products loaded successfully.',
				description: [
					result.message || null,
					result.rowLimit !== null ? `Limit: ${result.rowLimit}` : null,
					result.csvRows !== null ? `CSV rows: ${result.csvRows}` : null,
					result.upserted !== null ? `Upserted: ${result.upserted}` : null,
					result.skipped !== null ? `Skipped: ${result.skipped}` : null,
				].filter(Boolean).join(' | ') || undefined,
			}));
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				severity: 'warning',
				title: message || 'Failed to load Awin products.',
			}));
		} finally {
			setLoadingAwinProducts(false);
		}
	}, [dispatch, loadingAwinProducts]);

	return (
		<Box sx={{  }}>
			<Stack spacing={2} alignItems="stretch">
				<Stack spacing={1.5} sx={{ width: '100%' }}>
					<MightyButton
						fullWidth
						variant="outlined"
						startIcon="info"
						disabled={checkingAwinFeedSnapshot}
						onClick={handleCheckAwinFeedSnapshot}
					>
						{checkingAwinFeedSnapshot ? 'Checking feed snapshot...' : 'Check Awin feed snapshot'}
					</MightyButton>
					<MightyButton
						fullWidth
						variant="outlined"
						startIcon="play_arrow"
						disabled={loadingAwinProducts}
						onClick={handleLoadAwinProducts}
					>
						{loadingAwinProducts ? 'Loading Awin products...' : 'Load Awin Products'}
					</MightyButton>
					<MightyButton
						fullWidth
						variant="outlined"
						startIcon="delete"
						disabled={deletingQueue}
						onClick={() => setConfirmDeleteQueueOpen(true)}
					>
						{deletingQueue ? 'Deleting queue...' : 'Delete Queue'}
					</MightyButton>
					<MightyButton
						fullWidth
						variant="outlined"
						startIcon="delete"
						disabled={deletingProductQueue}
						onClick={() => setConfirmDeleteProductQueueOpen(true)}
					>
						{deletingProductQueue ? 'Deleting Awin records...' : 'Delete all Awin records'}
					</MightyButton>
				</Stack>
			</Stack>

			<ConfirmAction
				open={confirmDeleteQueueOpen}
				icon="delete"
				title="Delete everything from the queue?"
				body="This will permanently delete every item currently in the queue."
				handleConfirm={handleDeleteQueue}
				handleClose={() => setConfirmDeleteQueueOpen(false)}
			/>

			<ConfirmAction
				open={confirmDeleteProductQueueOpen}
				icon="delete"
				title="Delete all Awin records?"
				body="This will permanently delete every record from the Awin table."
				handleConfirm={handleDeleteProductQueue}
				handleClose={() => setConfirmDeleteProductQueueOpen(false)}
			/>
		</Box>
	);
}
