'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	ButtonBase,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';

type T_ProductData = {
	name?: string;
	description?: string;
	category?: string;
	price?: number | string;
	[key: string]: any;
};

export type T_ProductRecord = {
	product_id?: string | number;
	title?: string;
	created?: string;
	updated?: string;
	data?: unknown;
	[key: string]: any;
};

function parseProductData(value: unknown): T_ProductData {
	if (!value) return {};
	if (typeof value === 'object') {
		return value as T_ProductData;
	}
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			if (parsed && typeof parsed === 'object') {
				return parsed as T_ProductData;
			}
		} catch {
			return {};
		}
	}
	return {};
}

const ProductCard = ({
	product,
}: {
	product: T_ProductRecord;
}) => {
	const dispatch = useDispatch();
	const router = useRouter();
	const parsedData = parseProductData(product?.data);
	const name = typeof parsedData?.name === 'string' && parsedData.name.trim()
		? parsedData.name.trim()
		: (typeof product?.title === 'string' && product.title.trim() ? product.title.trim() : 'Untitled product');
	const description = typeof parsedData?.description === 'string' ? parsedData.description : '';
	const category = typeof parsedData?.category === 'string' ? parsedData.category : '';
	const price = parsedData?.price;
	const productId = product?.product_id !== undefined && product?.product_id !== null
		? String(product.product_id)
		: 'N/A';
	const canEdit = productId !== 'N/A';

	const handleEdit = () => {
		if (!canEdit) return;
		dispatch(navigateTo(router, `/products/${productId}`));
	};

	return (
		<ButtonBase
			onClick={handleEdit}
			disabled={!canEdit}
			sx={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: 1 }}
		>
			<Paper variant="outlined" sx={{ p: 1.5, width: '100%' }}>
				<Stack spacing={0.5}>
					<Typography variant="body1">{name}</Typography>
					{description ? (
						<Typography variant="body2" color="text.secondary">
							{description}
						</Typography>
					) : null}
					<Typography variant="caption" color="text.secondary">
						{category || 'Uncategorized'}
						{price !== undefined && price !== null && String(price).trim() !== '' ? ` | ${price}` : ''}
					</Typography>
				</Stack>
			</Paper>
		</ButtonBase>
	);
};

export default ProductCard;
