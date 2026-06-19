'use client';
import * as React from 'react';
import type { I_RenderAwin, T_AwinProduct } from '../../../types';
import {
	Box,
	Button,
	Chip,
	Link,
	Paper,
	Stack,
	Typography,
} from '@mui/material';

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

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedText(text: string, query: string) {
	const needle = query.trim();
	if (!needle) {
		return text;
	}

	const regex = new RegExp(`(${escapeRegExp(needle)})`, 'ig');
	const parts = text.split(regex);

	return parts.map((part, index) => {
		if (part.toLowerCase() === needle.toLowerCase()) {
			return (
				<Box
					component="mark"
					key={`hl_${index}`}
					sx={{ backgroundColor: 'warning.light', color: 'inherit', px: 0.25 }}
				>
					{part}
				</Box>
			);
		}
		return <React.Fragment key={`tx_${index}`}>{part}</React.Fragment>;
	});
}

export default function RenderAwin({
	awin,
	mode = 'list',
	query = '',
	onClick,
	buttonLabel = 'Use product',
}: I_RenderAwin) {
	const name = inferName(awin);
	const price = inferPrice(awin);
	const currency = inferCurrency(awin);
	const deepLink = asText(awin.aw_deep_link);
	const category = asText(awin.category_name);
	const merchant = inferMerchant(awin);
	const image = inferImage(awin);
	const description = asText(awin.description);

	if (mode === 'list') {
		return (
			<Paper
				variant="outlined"
				sx={{ p: 1.5, cursor: onClick ? 'pointer' : 'default' }}
				onClick={() => onClick?.(awin)}
			>
				<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="body1">
							{renderHighlightedText(name, query)}
						</Typography>
					</Box>
				</Stack>
			</Paper>
		);
	}

	return (
		<>
            <pre>{JSON.stringify(awin, null, 2)}</pre>
        </>
	);
}
