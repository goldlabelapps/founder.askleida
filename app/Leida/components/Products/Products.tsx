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

	return (
		<Box sx={{  }}>
			<Stack spacing={2} alignItems="flex-start">
				<Typography variant="body1">
					Queue cleanup is intentionally destructive. Use this only when you want to permanently remove every item from the queue.
				</Typography>
				<MightyButton
					variant="outlined"
					startIcon="delete"
					disabled={deletingQueue}
					onClick={() => setConfirmDeleteQueueOpen(true)}
				>
					{deletingQueue ? 'Deleting queue...' : 'Delete Queue'}
				</MightyButton>
			</Stack>

			<ConfirmAction
				open={confirmDeleteQueueOpen}
				icon="delete"
				title="Delete everything from the queue?"
				body="This will permanently delete every item currently in the queue."
				handleConfirm={handleDeleteQueue}
				handleClose={() => setConfirmDeleteQueueOpen(false)}
			/>
		</Box>
	);
}
