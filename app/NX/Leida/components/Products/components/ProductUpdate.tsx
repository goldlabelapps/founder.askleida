'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	IconButton,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { ConfirmAction, Icon, navigateTo } from '../../../../DesignSystem';
import {
	deleteProduct,
	fetchSupabaseRows,
	initSupabase,
	updateProduct,
	useSupabase,
} from '../../../../Leida';
import { Editable, setNXAdmin } from '../../../../NXAdmin';

const PRODUCTS_TABLE = 'products';

type T_ProductData = {
	name?: string;
	description?: string;
	category?: string;
	price?: number | string;
	[key: string]: any;
};

function parseProductData(value: unknown): T_ProductData {
	if (!value) return {};
	if (typeof value === 'object') return value as T_ProductData;
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			if (parsed && typeof parsed === 'object') return parsed as T_ProductData;
		} catch {
			return {};
		}
	}
	return {};
}

const ProductUpdate = () => {
	const dispatch = useDispatch();
	const router = useRouter();
	const pathname = usePathname();
	const supabase = useSupabase();
	const didRequestRows = React.useRef(false);
	const productId = pathname?.split('/').pop() ?? '';
	const rowsState = supabase?.rowsByTable?.[PRODUCTS_TABLE] || null;
	const rows = Array.isArray(rowsState?.rows) ? rowsState.rows : [];
	const row = rows.find((item: any) => String(item?.product_id) === productId) || null;
	const productData = parseProductData(row?.data);
	const currentTitle = typeof row?.title === 'string' && row.title.trim()
		? row.title.trim()
		: (typeof productData?.name === 'string' ? productData.name : '');
	const currentDescription = typeof productData?.description === 'string' ? productData.description : '';
	const currentCategory = typeof productData?.category === 'string' ? productData.category : '';
	const currentPrice = (() => {
		const value = productData?.price;
		if (typeof value === 'number' && Number.isFinite(value)) return String(value);
		if (typeof value === 'string') return value;
		return '';
	})();

	const [title, setTitle] = React.useState(currentTitle);
	const [description, setDescription] = React.useState(currentDescription);
	const [category, setCategory] = React.useState(currentCategory);
	const [price, setPrice] = React.useState(currentPrice);
	const [saving, setSaving] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = React.useState(false);

	const canSave =
		title.trim() !== currentTitle
		|| description.trim() !== currentDescription
		|| category.trim() !== currentCategory
		|| price.trim() !== currentPrice;

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

	React.useEffect(() => {
		setTitle(currentTitle);
	}, [currentTitle]);

	React.useEffect(() => {
		setDescription(currentDescription);
	}, [currentDescription]);

	React.useEffect(() => {
		setCategory(currentCategory);
	}, [currentCategory]);

	React.useEffect(() => {
		setPrice(currentPrice);
	}, [currentPrice]);

	React.useEffect(() => {
		dispatch(setNXAdmin('header', {
			title: currentTitle || 'Product',
			icon: 'products',
		}));
	}, [currentTitle, dispatch]);

	const handleBack = () => {
		dispatch(navigateTo(router, '/products'));
	};

	const handleSave = async () => {
		if (!productId) return;
		if (!canSave) return;
		setError(null);
		setSaving(true);
		try {
			await dispatch(updateProduct({
				product_id: productId,
				title,
				description,
				category,
				price,
			}));
			dispatch(navigateTo(router, '/products'));
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setError(msg);
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = () => {
		setConfirmOpen(true);
	};

	const handleCloseConfirm = () => {
		setConfirmOpen(false);
	};

	const handleConfirmDelete = async () => {
		if (!productId) return;
		try {
			setConfirmOpen(false);
			setDeleting(true);
			await dispatch(deleteProduct(productId));
			router.push('/products');
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setError(msg);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<Paper variant="outlined" sx={{ p: 1.5 }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
				<IconButton color="primary" disabled={deleting || saving} onClick={handleBack}>
					<Icon icon="left" />
				</IconButton>
				<IconButton color="primary" disabled={deleting || saving} onClick={handleDelete}>
					<Icon icon="delete" />
				</IconButton>
			</Stack>

			{rowsState?.loading ? (
				<Typography variant="body2">Loading...</Typography>
			) : null}
			{rowsState?.error ? (
				<Alert severity="error">{rowsState.error}</Alert>
			) : null}
			{!rowsState?.loading && !row ? (
				<Alert severity="warning">Product not found.</Alert>
			) : null}

			{row ? (
				<Stack spacing={2}>
					<Editable
						label="Title"
						value={title}
						variant="standard"
						onChange={setTitle}
						disabled={saving || deleting}
					/>
					<Editable
						label="Description"
						value={description}
						variant="standard"
						onChange={setDescription}
						disabled={saving || deleting}
					/>
					<Editable
						label="Category"
						value={category}
						variant="standard"
						onChange={setCategory}
						disabled={saving || deleting}
					/>
					<Editable
						label="Price"
						value={price}
						variant="standard"
						onChange={setPrice}
						disabled={saving || deleting}
					/>
					<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Button
							variant="contained"
							startIcon={<Icon icon="save" />}
							onClick={handleSave}
							disabled={saving || deleting || !canSave}
						>
							{saving ? 'Saving...' : 'Save'}
						</Button>
					</Box>
				</Stack>
			) : null}

			{error ? (
				<Typography variant="body2" color="error" sx={{ mt: 1 }}>
					{error}
				</Typography>
			) : null}

			<ConfirmAction
				open={confirmOpen}
				icon="delete"
				title="Delete Product"
				body="Are you sure you want to delete this product? This action cannot be undone."
				handleConfirm={handleConfirmDelete}
				handleClose={handleCloseConfirm}
			/>
		</Paper>
	);
};

export default ProductUpdate;
