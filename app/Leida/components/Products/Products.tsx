'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { T_Product } from './components/FindProduct';
import {
	Box,
	Grid,
	Paper,
	Stack,
	Tooltip,
	Typography,
	Fab,
} from '@mui/material';
import { Icon, navigateTo } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import {
	setLeida,
	useDash,
	ListProducts,
	MightyButton,
	AffiliatePlayer,
} from '../../../Leida';

export default function Products() {
	const dispatch = useDispatch();
	const router = useRouter();
	const dash = useDash();
	const [showFindProduct, setShowFindProduct] = React.useState(false);
	const [visibleProducts, setVisibleProducts] = React.useState<T_Product[]>([]);
	const [selectedProduct, setSelectedProduct] = React.useState<T_Product | null>(null);

	React.useEffect(() => {
		if (dash && dash.title) {
			dispatch(setLeida('header', {
				title: 'Products',
				icon: 'products',
			}));
		}
	}, [dispatch, dash?.title]);

	React.useEffect(() => {
		if (!selectedProduct) return;

		const stillVisible = visibleProducts.some((product) => product === selectedProduct);
		if (!stillVisible) {
			setSelectedProduct(visibleProducts[0] ?? null);
		}
	}, [visibleProducts, selectedProduct]);

	return (
		<Box sx={{ p: 2 }}>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Stack spacing={2}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>

						<Typography variant="h5">
							Products
						</Typography>
						
						<Box sx={{ flexGrow: 1 }} />
						<MightyButton
							kind="button"
							startIcon="awin"
							endIcon="add"
							variant="outlined"
							color="primary"
							onClick={() => {
								dispatch(navigateTo(router, '/awin'));
							}}
							
						>
							Awin
						</MightyButton>
					</Box>
				</Stack>
			</Paper>
			<Grid container spacing={2} sx={{ mt: 1 }}>
				<Grid size={{
					xs: 12,
					md: 4
				}}>
					<ListProducts
						showFindProduct={showFindProduct}
						onVisibleProductsChange={setVisibleProducts}
						onProductSelect={setSelectedProduct}
					/>
				</Grid>

				<Grid size={{
					xs: 12,
					md: 8
				}}>
					<AffiliatePlayer
						products={visibleProducts}
						selectedProduct={selectedProduct}
					/>
				</Grid>
			</Grid>
			
		</Box>
	);
}