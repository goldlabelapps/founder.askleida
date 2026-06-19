'use client';
import * as React from 'react';
import {
	Box,
	Chip,
	Grid,
	Link,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import type { T_AwinProduct } from '../../../types';

interface I_ListAwin {
	products: T_AwinProduct[];
}

function asText(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function inferName(product: T_AwinProduct): string {
	return asText(product.product_name) || 'Untitled product';
}

function inferPrice(product: T_AwinProduct): string {
	const raw = product.search_price;
	if (typeof raw === 'number' && Number.isFinite(raw)) {
		return raw.toFixed(2);
	}
	if (typeof raw === 'string' && raw.trim()) {
		return raw.trim();
	}
	return '';
}

function inferCurrency(product: T_AwinProduct): string {
	return asText(product.currency) || asText(product.data?.display_price)?.slice(0, 3) || 'GBP';
}

function inferImage(product: T_AwinProduct): string {
	return asText(product.data?.merchant_image_url) || asText(product.data?.aw_image_url);
}

function inferMerchant(product: T_AwinProduct): string {
	return asText(product.data?.merchant_name);
}

export default function ListAwin({ products }: I_ListAwin) {
	if (!products.length) {
		return (
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="body2" color="text.secondary">
					No AWIN products loaded yet.
				</Typography>
			</Paper>
		);
	}

	return (
		<Grid container spacing={2}>
			{products.map((product, index) => {
				const name = inferName(product);
				const price = inferPrice(product);
				const currency = inferCurrency(product);
				const deepLink = asText(product.aw_deep_link);
				const category = asText(product.category_name);
				const merchant = inferMerchant(product);
				const image = inferImage(product);
				const description = asText(product.description);
				const rowId = asText(product.id) || asText(product.unique_key) || `${index}`;

				return (
					<Grid key={rowId} size={{ xs: 12, md: 6, lg: 4 }}>
						<Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
							<Stack spacing={1.25}>
								{image ? (
									<Box
										component="img"
										src={image}
										alt={name}
										sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 1 }}
									/>
								) : null}

								<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
									{name}
								</Typography>

								<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
									{price ? <Chip size="small" label={`${currency} ${price}`} /> : null}
									{category ? <Chip size="small" variant="outlined" label={category} /> : null}
									{merchant ? <Chip size="small" variant="outlined" label={merchant} /> : null}
								</Stack>

								{description ? (
									<Typography variant="body2" color="text.secondary">
										{description}
									</Typography>
								) : null}

								{deepLink ? (
									<Link href={deepLink} target="_blank" rel="noreferrer" underline="hover">
										Open AWIN link
									</Link>
								) : null}
							</Stack>
						</Paper>
					</Grid>
				);
			})}
		</Grid>
	);
}