'use client';
import * as React from 'react';
import { Grid } from '@mui/material';
import type { I_ListAwin } from '../../../types';
import RenderAwin from './RenderAwin';

function getName(product: any) {
	return typeof product?.product_name === 'string' ? product.product_name : '';
}

export default function ListAwin({ products, query = '', onSelect }: I_ListAwin) {
	const needle = query.trim().toLowerCase();
	const filteredProducts = needle
		? products.filter((product) => getName(product).toLowerCase().includes(needle))
		: products;

	if (!filteredProducts.length) {
		return null;
	}

	return (
		<>
			{filteredProducts.map((product, index) => {
				return <RenderAwin 
                            key={`awin_${index}`} 
                            awin={product} 
                            mode="list"
                            query={needle}
                            onClick={() => onSelect?.(product)}
                        />
			})}
		</>
	);
}