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
import { setNXAdmin } from '../../../NX/NXAdmin';
import {
	useDash,
	ListProducts,
} from '../../../Leida';

export default function Products() {
	const dispatch = useDispatch();
	const dash = useDash();
	const [showFindProduct, setShowFindProduct] = React.useState(false);

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
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Typography variant="h4">
							Products
						</Typography>
						
						<Tooltip title={showFindProduct ? 'Hide filters' : 'Show filters'}>
							<IconButton
								color="primary"
								onClick={() => setShowFindProduct((prev) => !prev)}
								sx={{ ml: 'auto' }}
								aria-label={showFindProduct ? 'Hide filters' : 'Show  filters'}
							>
								{showFindProduct ? <Icon icon="up" /> : <Icon icon="search" />}
							</IconButton>
						</Tooltip>
						<Fab
							color="primary"
						// onClick={handleNewPractitioner}
						>
							<Icon icon="awin" />
						</Fab>
					</Box>
				</Stack>
			</Paper>
			<ListProducts showFindProduct={showFindProduct} />
		</Box>
	);
}