'use client';
import * as React from 'react';
import {
	Alert,
	Box,
	Collapse,
	Grid,
	LinearProgress,
	Stack,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import {
	FindProduct,
	initProducts,
	RenderProduct,
	useLeidaBus,
	useProducts,
} from '../../../../Leida';
import type { T_Product } from './FindProduct';

type T_ListProductsProps = {
	showFindProduct?: boolean;
};

const ListProducts = ({ showFindProduct = true }: T_ListProductsProps) => {

	const dispatch = useDispatch();
	const productsSlice = useProducts();
	const bus = useLeidaBus('/api/products');
	const [visibleProducts, setVisibleProducts] = React.useState<T_Product[]>([]);
	const [viewMode, setViewMode] = React.useState<'card' | 'list'>('list');

	React.useEffect(() => {
		dispatch(initProducts());
	}, [dispatch]);

	const sourceProducts = React.useMemo(() => {
		const fromSlice = Array.isArray(productsSlice?.products)
			? (productsSlice.products as T_Product[])
			: [];
		const fromBus = Array.isArray(bus?.data)
			? (bus.data as T_Product[])
			: [];

		if (fromSlice.length > 0) return fromSlice;
		return fromBus;

	}, [productsSlice?.products, bus?.data]);

	React.useEffect(() => {
		setVisibleProducts(sourceProducts);
	}, [sourceProducts]);

	const loading = Boolean(productsSlice?.loading) || Boolean(bus?.loading);
	const error = typeof productsSlice?.error === 'string' && productsSlice.error
		? productsSlice.error
		: (typeof bus?.error === 'string' ? bus.error : null);

	return (
		<Stack spacing={2}>
			

			<Box sx={{ height: 6 }}>
				{loading ? <LinearProgress /> : null}
			</Box>

			{error ? <Alert severity="error">{error}</Alert> : null}

			{!loading && !error && visibleProducts.length === 0 ? (
				<Alert severity="info">No products found.</Alert>
			) : null}

			{viewMode === 'card' ? (
				<Grid container spacing={1.25}>
					{visibleProducts.map((product, index) => {
						const key = typeof product?.id === 'string' && product.id
							? product.id
							: `product-${index}`;

						return (
							<Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
								<RenderProduct product={product} viewMode="card" />
							</Grid>
						);
					})}
				</Grid>
			) : (
				<Stack spacing={1.25}>
					{visibleProducts.map((product, index) => {
						const key = typeof product?.id === 'string' && product.id
							? product.id
							: `product-${index}`;

						return (
							<Box key={key}>
								<RenderProduct product={product} viewMode="list" />
							</Box>
						);
					})}
				</Stack>
			)}
		</Stack>
	);
};

export default ListProducts;