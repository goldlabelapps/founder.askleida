"use client";
import * as React from 'react';
import { Alert, Box, Stack } from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { initSupabase } from '../../Supabase/actions/initSupabase';
import { fetchSupabaseRows } from '../../Supabase/actions/fetchSupabaseRows';
import { useSupabase } from '../../Supabase/hooks/useSupabase';
import ProductCard, { T_ProductRecord } from './ProductCard';

const PRODUCTS_TABLE = 'products';

const ProductDash = () => {
	const dispatch = useDispatch();
	const supabase = useSupabase();
	const didRequestRows = React.useRef(false);

	const rowsState = supabase?.rowsByTable?.[PRODUCTS_TABLE] || null;
	const rows = (Array.isArray(rowsState?.rows) ? rowsState.rows : []) as T_ProductRecord[];

	React.useEffect(() => {
		if (!supabase?.initted) {
			dispatch(initSupabase());
		}
	}, [dispatch, supabase?.initted]);

	React.useEffect(() => {
		if (!supabase?.initted) return;
		if (didRequestRows.current) return;
		dispatch(fetchSupabaseRows({ table: PRODUCTS_TABLE }));
		didRequestRows.current = true;
	}, [dispatch, supabase?.initted]);

	return (
		<Box sx={{ p: 2 }}>
			<Stack spacing={1.5}>
				{rowsState?.error && <Alert severity="error">{rowsState.error}</Alert>}
				{!rowsState?.loading && rows.length === 0 && (
					<Alert severity="info">No products found.</Alert>
				)}
				{rows.map((row, index) => {
					const key = row?.product_id !== undefined && row?.product_id !== null
						? String(row.product_id)
						: `product-${index}`;
					return <ProductCard key={key} product={row} />;
				})}
			</Stack>
		</Box>
	);
};

export default ProductDash;
