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
	Stack,
	Typography,
	useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {Icon} from '../../../../NX/DesignSystem';
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
	const [thumbMeta, setThumbMeta] = React.useState<T_ImageMeta>(INITIAL_IMAGE_META);
	const [merchantMeta, setMerchantMeta] = React.useState<T_ImageMeta>(INITIAL_IMAGE_META);

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

	const thumbUrl = getString(preferredRecord?.aw_image_url);
	const merchantImageUrl = getString(preferredRecord?.merchant_image_url);
	const deepLink = getString(preferredRecord?.merchant_deep_link) || getString(preferredRecord?.aw_deep_link);

	React.useEffect(() => {
		setThumbMeta(INITIAL_IMAGE_META);
		setMerchantMeta(INITIAL_IMAGE_META);
	}, [thumbUrl, merchantImageUrl, open]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			fullScreen={isMobile}
			sx={{ zIndex: (muiTheme) => muiTheme.zIndex.modal + 100 }}
		>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent dividers>
                <Box sx={{ mb: 2 }}>
					{deepLink ? (
						<Button
							variant="contained"
							startIcon={<Icon icon="link" />}
							href={deepLink}
							target="_blank"
							rel="noreferrer"
						>
							Deep Link
						</Button>
					) : (
						<Button
							variant="contained"
							startIcon={<Icon icon="link" />}
							disabled
						>
							Deep Link
						</Button>
					)}
                </Box>

				<Stack spacing={1.25} sx={{ mb: 2 }}>
					<Box>
						<Typography variant="caption" color="text.secondary">
							AWIN thumbnail
						</Typography>
						{thumbUrl ? (
							<>
								<CardMedia
									component="img"
									image={thumbUrl}
									alt={`${title} thumbnail`}
									sx={{ mt: 0.5, maxHeight: 160, objectFit: 'contain', borderRadius: 1 }}
									onLoad={(event) => {
										const img = event.currentTarget;
										setThumbMeta({ status: 'loaded', width: img.naturalWidth, height: img.naturalHeight });
									}}
									onError={() => setThumbMeta({ status: 'error', width: 0, height: 0 })}
								/>
								<Typography variant="caption" color="text.secondary">
									{thumbMeta.status === 'loaded'
										? `Loaded ${thumbMeta.width}x${thumbMeta.height}`
										: thumbMeta.status === 'error'
											? 'Broken image link'
											: 'Loading image...'}
								</Typography>
							</>
						) : (
							<Typography variant="caption" color="text.secondary">
								No thumbnail URL
							</Typography>
						)}
					</Box>

					
				</Stack>

				<Typography variant="body1">
                    {description}
                </Typography>
                
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(preferredAwin, null, 2)}
                </pre>
			</DialogContent>
			<DialogActions>
				<Button 
                    variant="contained"
                    startIcon={<Icon icon="cancel" />}
                    onClick={onClose}>
                        Cancel
                </Button>
			</DialogActions>
            x
		</Dialog>
	);
}
