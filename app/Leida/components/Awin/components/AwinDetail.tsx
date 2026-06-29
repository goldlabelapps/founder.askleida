'use client';
import * as React from 'react';
import {
	Box,
	CardMedia,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	Typography,
} from '@mui/material';
import { ConfirmAction, Icon } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import { usePaywall } from '../../../../NX/Paywall';
import { MightyButton } from '../../../index';
import { asText } from '../../../lib/asText';
import { processAWIN } from '../actions/processAWIN';
import type { I_AWINDetail } from '../../../types.d';

export default function AWINDetail({ open, awin, onClose, onProcessed }: I_AWINDetail) {
	const dispatch = useDispatch();
	const paywall = usePaywall();
	const [showRawData, setShowRawData] = React.useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);
	const [queueing, setQueueing] = React.useState(false);
	const [queueError, setQueueError] = React.useState<string | null>(null);

	const practitionerId = asText(paywall?.uid) || asText(paywall?.user?.uid);

	const data = awin?.data && typeof awin.data === 'object'
		? (awin.data as Record<string, unknown>)
		: {};

	const pickText = (...values: unknown[]): string => {
		for (const value of values) {
			if (typeof value === 'string' && value.trim()) {
				return value.trim();
			}
		}
		return '';
	};

	const title = pickText(awin?.product_name, data.product_name) || 'AWIN Product';
	const description = pickText(awin?.description, data.description) || 'No description available.';
	const merchant = pickText(data.merchant_name);
	const category = pickText(awin?.category_name, data.category_name, data.merchant_category);
	const thumbnailUrl = pickText(
		data.thumbnail,
		data.thumb_url,
		data.merchant_thumb_url,
		data.aw_image_url,
		data.image_url,
		data.merchant_image_url,
	);
	const merchantLink = pickText(data.merchant_deep_link);
	const awinLink = pickText(awin?.aw_deep_link, data.aw_deep_link);
	const displayPrice = pickText(data.display_price);
	const searchPrice = pickText(awin?.search_price, data.search_price);
	const currency = pickText(awin?.currency, data.currency);
	const price = displayPrice || (searchPrice ? `${currency || ''}${searchPrice}` : 'N/A');

	React.useEffect(() => {
		if (open) {
			setShowRawData(false);
			setConfirmDeleteOpen(false);
			setDeleting(false);
			setQueueing(false);
			setQueueError(null);
		}
	}, [open]);

	const handleQueueConfirm = async () => {
		if (!awin || !practitionerId || queueing) {
			return;
		}

		setQueueing(true);
		setQueueError(null);

		const result = await dispatch(
			processAWIN({
				awin,
				decision: 'queue',
				practitionerId,
			}) as any,
		);

		setQueueing(false);

		if (!result?.ok) {
			setQueueError(typeof result?.error === 'string' ? result.error : 'Failed to add product to queue.');
			return;
		}

		await onProcessed?.({ decision: 'queue', awin });
		onClose();
	};

	const handleDeleteConfirm = async () => {
		if (!awin || !practitionerId || deleting) {
			setConfirmDeleteOpen(false);
			return;
		}

		setDeleting(true);
		const result = await dispatch(
			processAWIN({
				awin,
				decision: 'delete',
				practitionerId,
			}) as any,
		);
		setDeleting(false);
		setConfirmDeleteOpen(false);

		if (result?.ok) {
			await onProcessed?.({ decision: 'delete', awin });
			onClose();
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			fullScreen={false}
			sx={{ zIndex: (muiTheme) => muiTheme.zIndex.modal + 100 }}
		>
			<DialogTitle sx={{ display: 'flex' }}>
				<Box sx={{ flexGrow: 1 }} />
				<MightyButton
					kind="icon"
					icon="awin"
					onClick={() => {
						window.open(awinLink, '_blank', 'noopener,noreferrer');
					}}
				/>
				<MightyButton
					kind="icon"
					icon="api"
					onClick={() => setShowRawData((prev) => !prev)}
				/>
				<MightyButton
					kind="icon"
					icon="link"
					onClick={() => {
						window.open(merchantLink, '_blank', 'noopener,noreferrer');
					}}
				/>
				<MightyButton
					kind="icon"
					onClick={onClose}
					icon="close"
				/>
			</DialogTitle>

			<DialogContent>
				{showRawData ? (
					<Box
						component="pre"
						sx={{
							m: 0,
							p: 2,
							borderRadius: 1,
							bgcolor: 'grey.100',
							overflowX: 'auto',
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
							fontSize: 13,
						}}
					>
						{JSON.stringify(awin ?? {}, null, 2)}
					</Box>
				) : null}

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: '260px 1fr' },
						gap: 2,
						alignItems: 'start',
					}}
				>
					<Box
						sx={{
							bgcolor: 'grey.100',
							borderRadius: 2,
							minHeight: 220,
							display: 'grid',
							placeItems: 'center',
							overflow: 'hidden',
						}}
					>
						{thumbnailUrl ? (
							<CardMedia
								component="img"
								image={thumbnailUrl}
								alt={title}
								sx={{
									width: '100%',
									height: 260,
									objectFit: 'contain',
									p: 1,
								}}
							/>
						) : (
							<Typography variant="body2" color="text.secondary">No thumbnail</Typography>
						)}
					</Box>

					<Stack spacing={1.5}>
						<Typography variant="h6">
							{title}
						</Typography>

						<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
							{description}
						</Typography>
					</Stack>
				</Box>

				{queueError ? <Typography variant="body2" color="error">{queueError}</Typography> : null}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5, pt: 2 }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={1}
					sx={{ width: '100%' }}
				>
					<MightyButton
						startIcon={'delete'}
						variant="outlined"
						color="error"
						fullWidth
						disabled={!awin || !practitionerId || deleting || queueing}
						onClick={() => setConfirmDeleteOpen(true)}>
						{deleting ? 'Deleting...' : 'Delete from AWIN'}
					</MightyButton>
					<MightyButton
						startIcon={'queue'}
						variant="contained"
						fullWidth
						disabled={!awin || !practitionerId || queueing || deleting}
						onClick={() => { void handleQueueConfirm(); }}>
						{queueing ? 'Adding...' : 'Add to Queue'}
					</MightyButton>
				</Stack>
			</DialogActions>

			<ConfirmAction
				open={confirmDeleteOpen}
				icon="delete"
				title="Delete this AWIN product?"
				body="This will remove it from the AWIN source list."
				handleConfirm={handleDeleteConfirm}
				handleClose={() => setConfirmDeleteOpen(false)}
				zIndex={1500}
			/>
		</Dialog>
	);
}
