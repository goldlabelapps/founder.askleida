'use client';
import * as React from 'react';
import { Alert, Box, Stack, Typography } from '@mui/material';

export default function AwinProcess() {
	return (
		<Box>
			<Stack spacing={1.5}>
				<Typography variant="h6" sx={{ fontWeight: 700 }}>
					Awin Product Processing
				</Typography>
				<Alert severity="info">
					Processing placeholder. Claude integration for product processing will go here.
				</Alert>
			</Stack>
		</Box>
	);
}
