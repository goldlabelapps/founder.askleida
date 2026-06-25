'use client';
import * as React from 'react';
import {
	Alert,
	Box,
	Button,
	Paper,
	Stack,
	Stepper,
	Step,
	StepLabel,
	Typography,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import type { T_AwinProduct } from '../../../types';
import { processAwin } from '../actions/processAwin';

type AwinProcessProps = {
	awin?: T_AwinProduct | null;
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

export default function AwinProcess({ awin = null }: AwinProcessProps) {
	const dispatch = useDispatch();
	const steps = ['Confirm product'];
	const productName = awin ? asText(awin.product_name) || 'Untitled product' : '';
	const category = awin ? asText(awin.category_name) : '';
	const price = awin ? inferPrice(awin) : '';
	const currency = awin ? asText(awin.currency) || 'GBP' : 'GBP';

	const handleProcess = () => {
		if (!awin) {
			return;
		}
		dispatch(processAwin(awin));
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
							Step 1: Confirm this is the product you want to process
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

						<Button
							variant="contained"
							onClick={handleProcess}
							disabled={!awin}
						>
							Yes
						</Button>
					</Stack>

			</Stack>
		</Box>
	);
}
