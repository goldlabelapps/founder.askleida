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
	ListItemButton,
	ListItemText,
	ListItemAvatar,
	Stack,
	Typography,
} from '@mui/material';
import { getProductCategoryLabel } from '../../../lib/getProductCategoryLabel';
import { getProductImageUrl } from '../../../lib/getProductImageUrl';
import { getProductName } from '../../../lib/getProductName';
import { getProductPriceLabel } from '../../../lib/getProductPriceLabel';
import type { T_RenderProductProps } from '../../../types.d';

const RenderProduct = ({
	product,
	onAddToCart,
	addingToCart = false,
	viewMode = 'card',
}: T_RenderProductProps) => {
	const [added, setAdded] = React.useState(false);

	const name = getProductName(product);
	const priceLabel = getProductPriceLabel(product);
	const imageUrl = getProductImageUrl(product);
	const categoryLabel = getProductCategoryLabel(product);
	const description = typeof product?.description === 'string' && product.description.trim()
		? product.description.trim()
		: '';

	const handleAddToCart = async () => {
		await onAddToCart?.(product);
		setAdded(true);
	};

	if (viewMode === 'list') {
		return (
			<Card variant="outlined">
				<ListItemButton
					sx={{ alignItems: 'flex-start'}}
					onClick={() => { void handleAddToCart(); }}
				>
					<ListItemText 
						primary={<Typography variant="caption">{name}</Typography>}
						// secondary={"description"}
					/>
				</ListItemButton>
			</Card>
		);
	}

	return (
		<Card
			variant="outlined"
			onClick={() => { void handleAddToCart(); }}
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				cursor: onAddToCart ? 'pointer' : 'default',
			}}
		>
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