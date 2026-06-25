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
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {Icon} from '../../../../NX/DesignSystem';
import { AwinProcess } from '../../../index';
import type { I_AwinDetail } from '../../../types';

type T_ImageMeta = {
	status: 'idle' | 'loaded' | 'error';
	width: number;
	height: number;
};

const INITIAL_IMAGE_META: T_ImageMeta = {
	status: 'idle',
	width: 0,
	height: 0,
};

function getString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

export default function AwinDetail({ open, awin, onClose }: I_AwinDetail) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [imageMeta, setImageMeta] = React.useState<T_ImageMeta>(INITIAL_IMAGE_META);
	const [isProcessing, setIsProcessing] = React.useState(true);

	const preferredData = awin?.data && typeof awin.data === 'object'
		? (awin.data as Record<string, unknown>)
		: {};

	// Prefer AWIN feed payload under data for duplicated fields.
	const preferredAwin = awin
		? {
			...awin,
			...preferredData,
			data: awin.data,
		}
		: null;
	const preferredRecord = preferredAwin as Record<string, unknown> | null;

	const title = typeof preferredAwin?.product_name === 'string' && preferredAwin.product_name.trim()
		? preferredAwin.product_name
		: 'Awin Detail';

	const description = typeof preferredAwin?.description === 'string' && preferredAwin.description.trim()
		? preferredAwin.description
		: 'No description available.';

	const imageUrl = [
		getString(preferredRecord?.large_image),
		getString(preferredRecord?.image_url),
		getString(preferredRecord?.merchant_image_url),
		getString(preferredRecord?.aw_image_url),
		getString(preferredRecord?.merchant_thumb_url),
	].find(Boolean) || '';
	const deepLink = getString(preferredRecord?.merchant_deep_link) || getString(preferredRecord?.aw_deep_link);

	React.useEffect(() => {
		setImageMeta(INITIAL_IMAGE_META);
	}, [imageUrl, open]);

	React.useEffect(() => {
		if (open) {
			setIsProcessing(true);
		}
	}, [open]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			fullScreen={isMobile}
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
					<AwinProcess awin={awin} />
				) : (
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
							gap: { xs: 2, md: 3 },
							alignItems: 'start',
						}}
					>
						<Stack spacing={1.25}>
							<Typography
								variant="body1"
								sx={{
									fontSize: { xs: '1rem', md: '1.05rem' },
									lineHeight: 1.75,
									color: 'text.primary',
								}}
							>
								{description}
							</Typography>
							
						</Stack>

						<Box>
							{imageUrl ? (
								<>
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
										onLoad={(event) => {
											const img = event.currentTarget;
											setImageMeta({ status: 'loaded', width: img.naturalWidth, height: img.naturalHeight });
										}}
										onError={() => setImageMeta({ status: 'error', width: 0, height: 0 })}
									/>
								</>
							) : (
								<Box
									sx={{
										height: { xs: 220, md: 320 },
										display: 'grid',
										placeItems: 'center',
										bgcolor: 'grey.100',
										borderRadius: 2,
									}}
								>
									<Typography variant="body2" color="text.secondary">
										No image available
									</Typography>
								</Box>
							)}
						</Box>
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5, pt: 2 }}>
				{!isProcessing && <>
					<Button
						fullWidth
						variant={isProcessing ? 'outlined' : 'contained'}
						startIcon={<Icon icon={isProcessing ? 'left' : 'claude'} />}
						onClick={() => setIsProcessing((prev) => !prev)}
					>
						{isProcessing ? 'Back to product details' : 'Process product'}
					</Button></>}
				
			</DialogActions>
		</Dialog>
	);
}
