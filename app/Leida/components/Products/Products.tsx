'use client';
import * as React from 'react';
import {
	Box,
	IconButton,
	Paper,
	Stack,
	Tooltip,
	Typography,
	Fab,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { Icon } from '../../../NX/DesignSystem';
import {
	setLeida,
	useDash,
	ListProducts,
	MightyButton,
	AffiliatePlayer,
} from '../../../Leida';

export default function Products() {
	const dispatch = useDispatch();
	const dash = useDash();
	const [showFindProduct, setShowFindProduct] = React.useState(false);

	React.useEffect(() => {
		if (dash && dash.title) {
			dispatch(setLeida('header', {
				title: 'Products',
				icon: 'products',
			}));
		}
	}, [dispatch, dash?.title]);

	return (
		<Box sx={{ p: 2 }}>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Stack spacing={2}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Typography variant="h4">
							Products
						</Typography>
						
						<Box sx={{ flexGrow: 1 }} />
						<MightyButton
							kind="button"
							variant="contained"
							color="primary"
						// onClick={handleNewPractitioner}
							startIcon="awin"
							endIcon="add"
						>
							Awin
						</MightyButton>
					</Box>
				</Stack>
			</Paper>
			<AffiliatePlayer />
			<ListProducts showFindProduct={showFindProduct} />
		</Box>
	);
}