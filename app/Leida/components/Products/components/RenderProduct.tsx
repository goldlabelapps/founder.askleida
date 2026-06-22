'use client';
import * as React from 'react';
import {
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	CardMedia,
	Chip,
	Stack,
	Typography,
} from '@mui/material';
import { T_Product } from './FindProduct';

type T_RenderProductProps = {
	product: T_Product;
	onAddToCart?: (product: T_Product) => void | Promise<void>;
	addingToCart?: boolean;
	viewMode?: 'card' | 'list';
};

function getName(product: T_Product): string {
	if (typeof product?.name === 'string' && product.name.trim()) return product.name.trim();
	if (typeof product?.title === 'string' && product.title.trim()) return product.title.trim();
	if (typeof product?.product_name === 'string' && product.product_name.trim()) return product.product_name.trim();
	return 'Untitled product';
}

function getPriceLabel(product: T_Product): string | null {
	const raw = product?.price ?? product?.search_price ?? product?.store_price;
	if (typeof raw === 'number' && Number.isFinite(raw)) {
		return `GBP ${raw.toFixed(2)}`;
	}
	if (typeof raw === 'string' && raw.trim()) {
		const normalized = raw.trim();
		if (/^\d+(\.\d+)?$/.test(normalized)) {
			return `GBP ${normalized}`;
		}
		return normalized;
	}
	return null;
}

function getImageUrl(product: T_Product): string | null {
	const candidates = [
		product?.image,
		product?.image_url,
		product?.merchant_image_url,
		product?.aw_image_url,
		product?.merchant_thumb_url,
		product?.large_image,
	];

	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim()) {
			return candidate.trim();
		}
	}

	return null;
}

function getCategoryLabel(product: T_Product): string | null {
	const value = product?.category ?? product?.category_name ?? product?.merchant_category;
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const RenderProduct = ({ product, onAddToCart, addingToCart = false, viewMode = 'card' }: T_RenderProductProps) => {
	const [added, setAdded] = React.useState(false);

	const name = getName(product);
	const priceLabel = getPriceLabel(product);
	const imageUrl = getImageUrl(product);
	const categoryLabel = getCategoryLabel(product);
	const description = typeof product?.description === 'string' && product.description.trim()
		? product.description.trim()
		: '';

	const handleAddToCart = async () => {
		await onAddToCart?.(product);
		setAdded(true);
	};

	if (viewMode === 'list') {
		return (
			<Card variant="outlined" sx={{ display: 'flex', flexDirection: 'row' }}>
				{imageUrl ? (
					<CardMedia
						component="img"
						sx={{ width: 140, height: 140, objectFit: 'cover', bgcolor: 'grey.100' }}
						image={imageUrl}
						alt={name}
					/>
				) : (
					<Box
						sx={{
							width: 140,
							height: 140,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							bgcolor: 'grey.100',
						}}
					>
						<Typography variant="body2" color="text.secondary">
							No image
						</Typography>
					</Box>
				)}

				<CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
					<Stack spacing={1}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
							{name}
						</Typography>

						<Stack direction="row" spacing={1}>
							{priceLabel ? <Chip size="small" label={priceLabel} /> : null}
							{categoryLabel ? <Chip size="small" variant="outlined" label={categoryLabel} /> : null}
						</Stack>

						{description ? (
							<Typography variant="body2" color="text.secondary" sx={{ lineClamp: 2 }}>
								{description}
							</Typography>
						) : null}
					</Stack>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			{imageUrl ? (
				<CardMedia
					component="img"
					height="180"
					image={imageUrl}
					alt={name}
					sx={{ objectFit: 'cover', bgcolor: 'grey.100' }}
				/>
			) : (
				<Box
					sx={{
						height: 180,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						bgcolor: 'grey.100',
					}}
				>
					<Typography variant="body2" color="text.secondary">
						No image
					</Typography>
				</Box>
			)}

			<CardContent sx={{ flexGrow: 1 }}>
				<Stack spacing={1}>
					<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
						{name}
					</Typography>

					<Stack direction="row" spacing={1}>
						{priceLabel ? <Chip size="small" label={priceLabel} /> : null}
						{categoryLabel ? <Chip size="small" variant="outlined" label={categoryLabel} /> : null}
					</Stack>

					{description ? (
						<Typography variant="body2" color="text.secondary">
							{description}
						</Typography>
					) : null}
				</Stack>
			</CardContent>
		</Card>
	);
};

export default RenderProduct;