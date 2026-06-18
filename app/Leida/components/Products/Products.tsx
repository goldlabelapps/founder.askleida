'use client';
import * as React from 'react';
import {
	Box,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { setNXAdmin } from '../../../NX/NXAdmin';
import {
	useDash,
	ListProducts,
} from '../../../Leida';

export default function Products() {
	const dispatch = useDispatch();
	const dash = useDash();

	React.useEffect(() => {
		if (dash && dash.title) {
			dispatch(setNXAdmin('header', {
				title: 'Products',
				icon: 'products',
			}));
		}
	}, [dispatch, dash?.title]);

	return (
		<Box sx={{ p: 2 }}>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Stack spacing={2}>
					<Typography variant="h4">
						Products
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Search, filter, and sort products from your current dataset.
					</Typography>
					<ListProducts />
				</Stack>
			</Paper>
		</Box>
	);
}