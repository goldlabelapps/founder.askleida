'use client';

import * as React from 'react';
import type { T_Product } from '../../types.d';
import { useRouter } from 'next/navigation';
import {
	Box,
	Typography,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import {
	setLeida,
	useDash,
	ListProducts,
} from '../../../Leida';

export default function Products() {
	const dispatch = useDispatch();
	const router = useRouter();
	const dash = useDash();
	const [showFindProduct, setShowFindProduct] = React.useState(false);
	const [visibleProducts, setVisibleProducts] = React.useState<T_Product[]>([]);
	const [selectedProduct, setSelectedProduct] = React.useState<T_Product | null>(null);

	React.useEffect(() => {
			dispatch(setLeida('header', {
				title: 'Products',
				icon: 'products',
			}));
	}, [dispatch]);

	React.useEffect(() => {
		if (!selectedProduct) return;

		const stillVisible = visibleProducts.some((product) => product === selectedProduct);
		if (!stillVisible) {
			setSelectedProduct(visibleProducts[0] ?? null);
		}
	}, [visibleProducts, selectedProduct]);

	return (
		<Box sx={{}}>

			<Typography variant="h6" sx={{ mb: 1 }}>
				High level actions
			</Typography>
			
			<ul>
				<li>Check Awin for updated Product Feed</li>
			</ul>
		</Box>
	);
}
