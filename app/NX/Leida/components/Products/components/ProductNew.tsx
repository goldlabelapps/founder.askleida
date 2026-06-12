"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Stack,
} from '@mui/material';
import { Icon, navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import {
	initSupabase,
	fetchSupabaseRows,
	saveSupabaseRecord,
	useSupabase,
} from '../../../../Leida';
import { Editable, setNXAdmin } from '../../../../NXAdmin';

const PRODUCTS_TABLE = 'products';

const ProductNew = () => {
	const dispatch = useDispatch();
	const router = useRouter();
	const supabase = useSupabase();
	const [title, setTitle] = React.useState('');
	const [description, setDescription] = React.useState('');
	const [category, setCategory] = React.useState('');
	const [price, setPrice] = React.useState('');
	const [createLoading, setCreateLoading] = React.useState(false);
	const [createError, setCreateError] = React.useState<string | null>(null);
	const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!supabase?.initted) {
			dispatch(initSupabase());
		}
	}, [dispatch, supabase?.initted]);

	React.useEffect(() => {
		dispatch(setNXAdmin('header', {
			title: 'New Product',
			icon: 'products',
		}));
	}, [dispatch]);

	const handleCreateProduct = React.useCallback(async () => {
		setCreateError(null);
		setCreateSuccess(null);

		const normalizedTitle = title.trim();
		if (!normalizedTitle) {
			setCreateError('A product must have a title');
			return;
		}

		const parsedPrice = Number(price);
		if (!Number.isFinite(parsedPrice)) {
			setCreateError('Price must be a valid number');
			return;
		}

		setCreateLoading(true);
		try {
			const response = await dispatch(saveSupabaseRecord({
				table: PRODUCTS_TABLE,
				values: {
					title: normalizedTitle,
					data: {
						name: normalizedTitle,
						description: description.trim(),
						category: category.trim(),
						price: parsedPrice,
					},
				},
			}));

			await dispatch(fetchSupabaseRows({ table: PRODUCTS_TABLE }));

			const productId = response?.data?.product_id || response?.product_id;
			if (productId) {
				setCreateSuccess(`Created ${normalizedTitle}. Navigating to product...`);
				setTimeout(() => {
					router.push(`/products/${productId}`);
				}, 500);
			} else {
				setCreateSuccess(`Created ${normalizedTitle} and refreshed products.`);
				setTitle('');
				setDescription('');
				setCategory('');
				setPrice('');
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setCreateError(msg || 'Failed to create product');
		} finally {
			setCreateLoading(false);
		}
	}, [category, description, dispatch, price, router, title]);

	return (
		<>
			{createError || createSuccess ? (
				<Box sx={{ mb: 2 }}>
					{createError && <Alert severity="error">{createError}</Alert>}
					{createSuccess && <Alert severity="success">{createSuccess}</Alert>}
				</Box>
			) : null}

			<Stack spacing={1.5} sx={{ mx: 2 }}>
				<Editable
					label="Product Title"
					variant="standard"
					value={title}
					onChange={setTitle}
					disabled={createLoading}
					autoFocus
					placeholder="Hydrating serum"
				/>
				<Editable
					label="Description"
					variant="standard"
					value={description}
					onChange={setDescription}
					disabled={createLoading}
					placeholder="Short description"
				/>
				<Editable
					label="Category"
					variant="standard"
					value={category}
					onChange={setCategory}
					disabled={createLoading}
					placeholder="skincare"
				/>
				<Editable
					label="Price"
					variant="standard"
					value={price}
					onChange={setPrice}
					disabled={createLoading}
					placeholder="29.99"
				/>
				<Button
					variant="text"
					endIcon={<Icon icon="save" />}
					onClick={handleCreateProduct}
					disabled={createLoading}
				>
					{createLoading ? 'Adding...' : 'Add Product'}
				</Button>
			</Stack>
		</>
	);
};

export default ProductNew;
