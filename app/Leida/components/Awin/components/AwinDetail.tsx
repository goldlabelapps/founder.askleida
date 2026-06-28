'use client';
import * as React from 'react';
import {
	Box,
	Button,
	CardMedia,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Stack,
	Typography,
} from '@mui/material';
import {Icon} from '../../../../NX/DesignSystem';
import { AwinProcess } from '../../../index';
import type { I_AwinDetail } from '../../../types.d';

export default function AwinDetail({ open, awin, onClose, onProcessed }: I_AwinDetail) {
	const [isProcessing, setIsProcessing] = React.useState(false);
	const [showRawData, setShowRawData] = React.useState(false);

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
	const imageUrl = pickText(data.merchant_image_url, data.aw_image_url);
	const merchantLink = pickText(data.merchant_deep_link);
	const awinLink = pickText(awin?.aw_deep_link, data.aw_deep_link);
	const displayPrice = pickText(data.display_price);
	const searchPrice = pickText(awin?.search_price, data.search_price);
	const currency = pickText(awin?.currency, data.currency);
	const price = displayPrice || (searchPrice ? `${currency || ''}${searchPrice}` : 'N/A');

	React.useEffect(() => {
		if (open) {
			setIsProcessing(false);
			setShowRawData(false);
		}
	}, [open]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			fullScreen={true}
			sx={{ zIndex: (muiTheme) => muiTheme.zIndex.modal + 100 }}
		>
			<DialogTitle sx={{  }}>
				<IconButton
					aria-label="close dialog"
					onClick={onClose}
					sx={{
						position: 'absolute',
						right: 12,
						top: 12,
					}}
				>
					<Icon icon="cancel" />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers>
				{isProcessing ? (
					<AwinProcess
						awin={awin}
						onProcessed={async (payload) => {
							await onProcessed?.(payload);
							onClose();
						}}
					/>
				) : (
					<Stack spacing={2}>
						<Typography variant="h6">{title}</Typography>

						{imageUrl ? (
							<CardMedia
								component="img"
								image={imageUrl}
								alt={title}
								sx={{
									width: '100%',
									maxHeight: { xs: 260, md: 360 },
									objectFit: 'contain',
									borderRadius: 2,
									bgcolor: 'grey.100',
									p: 1,
								}}
							/>
						) : null}

						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
							<Typography variant="body2"><strong>Price:</strong> {price}</Typography>
							{merchant ? <Typography variant="body2"><strong>Merchant:</strong> {merchant}</Typography> : null}
							{category ? <Typography variant="body2"><strong>Category:</strong> {category}</Typography> : null}
						</Stack>

						<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
							{description}
						</Typography>

						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
							{merchantLink ? (
								<Button component="a" href={merchantLink} target="_blank" rel="noreferrer" variant="outlined">
									Open merchant page
								</Button>
							) : null}
							{awinLink ? (
								<Button component="a" href={awinLink} target="_blank" rel="noreferrer" variant="outlined">
									Open AWIN link
								</Button>
							) : null}
						</Stack>

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
					</Stack>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5, pt: 2 }}>
				{!isProcessing ? (
					<Button
						variant="outlined"
						onClick={() => setShowRawData((prev) => !prev)}
					>
						{showRawData ? 'Hide raw data' : 'Show raw data'}
					</Button>
				) : null}
				<Button
					fullWidth
					variant={isProcessing ? 'outlined' : 'contained'}
					startIcon={<Icon icon={isProcessing ? 'left' : 'claude'} />}
					onClick={() => setIsProcessing((prev) => !prev)}
				>
					{isProcessing ? 'Back to product data' : 'Process product'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
