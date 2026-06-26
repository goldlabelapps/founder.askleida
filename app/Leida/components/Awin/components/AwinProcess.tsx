'use client';
import * as React from 'react';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Stack,
	Stepper,
	Step,
	StepLabel,
	Typography,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { usePaywall } from '../../../../NX/Paywall';
import type { T_AwinProcessDecision, T_AwinProduct } from '../../../types';
import { processAwin } from '../actions/processAwin';

type AwinProcessProps = {
	awin?: T_AwinProduct | null;
	onProcessed?: (payload: { decision: T_AwinProcessDecision; awin: T_AwinProduct }) => void | Promise<void>;
};

function asText(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function inferPrice(product: T_AwinProduct): string {
	const raw = product.search_price;
	if (typeof raw === 'number' && Number.isFinite(raw)) {
		return raw.toFixed(2);
	}
	if (typeof raw === 'string' && raw.trim()) {
		return raw.trim();
	}
	return '';
}

export default function AwinProcess({ awin = null, onProcessed }: AwinProcessProps) {
	const dispatch = useDispatch();
	const paywall = usePaywall();
	const steps = ['Confirm product'];
	const productName = awin ? asText(awin.product_name) || 'Untitled product' : '';
	const category = awin ? asText(awin.category_name) : '';
	const price = awin ? inferPrice(awin) : '';
	const currency = awin ? asText(awin.currency) || 'GBP' : 'GBP';
	const [loadingDecision, setLoadingDecision] = React.useState<T_AwinProcessDecision | null>(null);
	const [error, setError] = React.useState<string>('');
	const [success, setSuccess] = React.useState<string>('');

	const practitionerId = asText(paywall?.uid) || asText(paywall?.user?.uid);

	const handleProcess = async (decision: T_AwinProcessDecision) => {
		if (!awin) {
			return;
		}

		if (!practitionerId) {
			setError('Practitioner ID is required before processing.');
			return;
		}

		setError('');
		setSuccess('');
		setLoadingDecision(decision);

		const result = await dispatch(
			processAwin({
				awin,
				decision,
				practitionerId,
			}) as any,
		);

		setLoadingDecision(null);

		if (!result?.ok) {
			setError(typeof result?.error === 'string' ? result.error : 'Failed to process product.');
			return;
		}

		setSuccess(decision === 'queue' ? 'Added to processing queue.' : 'Queued as delete decision.');
		await onProcessed?.({ decision, awin });
	};

	return (
		<Box>
			<Stack spacing={2}>

				<Stepper activeStep={0} alternativeLabel>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

					<Stack spacing={1.25}>
						<Typography variant="body1" sx={{ }}>
							Step 1: Add to processing queue?
						</Typography>

						{awin ? (
							<>
								<Typography variant="body1" sx={{ fontWeight: 600 }}>
									{productName}
								</Typography>
								{category ? (
									<Typography variant="body2" color="text.secondary">
										Category: {category}
									</Typography>
								) : null}
								{price ? (
									<Typography variant="body2" color="text.secondary">
										Price: {currency} {price}
									</Typography>
								) : null}
							</>
						) : (
							<Alert severity="warning">No product selected for processing.</Alert>
						)}

						{error ? <Alert severity="error">{error}</Alert> : null}
						{success ? <Alert severity="success">{success}</Alert> : null}

						<Stack direction="row" spacing={1}>
							<Button
								variant="contained"
								onClick={() => handleProcess('queue')}
								disabled={!awin || Boolean(loadingDecision)}
							>
								{loadingDecision === 'queue' ? <CircularProgress size={18} color="inherit" /> : 'Yes'}
							</Button>
							<Button
								variant="outlined"
								color="error"
								onClick={() => handleProcess('delete')}
								disabled={!awin || Boolean(loadingDecision)}
							>
								{loadingDecision === 'delete' ? <CircularProgress size={18} color="inherit" /> : 'No, Delete'}
							</Button>
						</Stack>
					</Stack>

			</Stack>
		</Box>
	);
}
