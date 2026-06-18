'use client';
import * as React from 'react';
import {
	Box,
	Button,
	Chip,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
	MenuItem,
} from '@mui/material';

export type T_Product = {
	id?: string;
	name?: string;
	title?: string;
	product_name?: string;
	description?: string;
	brand?: string;
	brand_name?: string;
	category?: string;
	category_name?: string;
	merchant_category?: string;
	price?: number | string;
	search_price?: number | string;
	store_price?: number | string;
	in_stock?: boolean | string | number;
	updated?: string;
	created?: string;
	[key: string]: unknown;
};

type T_SortBy = 'relevance' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'updated-desc';

type T_FindProductProps = {
	products: T_Product[];
	onProductsChange?: (nextProducts: T_Product[]) => void;
};

const SORT_OPTIONS: Array<{ value: T_SortBy; label: string }> = [
	{ value: 'relevance', label: 'Relevance' },
	{ value: 'name-asc', label: 'Name (A-Z)' },
	{ value: 'name-desc', label: 'Name (Z-A)' },
	{ value: 'price-asc', label: 'Price (Low to high)' },
	{ value: 'price-desc', label: 'Price (High to low)' },
	{ value: 'updated-desc', label: 'Most recent' },
];

function toText(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function getProductName(product: T_Product): string {
	return toText(product?.name)
		|| toText(product?.title)
		|| toText(product?.product_name)
		|| 'Untitled product';
}

function getProductCategory(product: T_Product): string {
	return toText(product?.category)
		|| toText(product?.category_name)
		|| toText(product?.merchant_category);
}

function getProductBrand(product: T_Product): string {
	return toText(product?.brand)
		|| toText(product?.brand_name);
}

function getProductPrice(product: T_Product): number | null {
	const value = product?.price ?? product?.search_price ?? product?.store_price;

	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim()) {
		const parsed = Number(value.replace(/[^0-9.-]/g, ''));
		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function getProductUpdatedAt(product: T_Product): number {
	const raw = toText(product?.updated) || toText(product?.created);
	if (!raw) return 0;
	const parsed = Date.parse(raw);
	return Number.isNaN(parsed) ? 0 : parsed;
}

function includesQuery(product: T_Product, normalizedQuery: string): boolean {
	if (!normalizedQuery) return true;

	const haystack = [
		getProductName(product),
		toText(product?.description),
		getProductBrand(product),
		getProductCategory(product),
	]
		.join(' ')
		.toLowerCase();

	return haystack.includes(normalizedQuery);
}

export default function FindProduct({ products, onProductsChange }: T_FindProductProps) {
	const [query, setQuery] = React.useState('');
	const [selectedCategory, setSelectedCategory] = React.useState('all');
	const [selectedBrand, setSelectedBrand] = React.useState('all');
	const [sortBy, setSortBy] = React.useState<T_SortBy>('relevance');

	const categories = React.useMemo(() => {
		const unique = new Set<string>();
		for (const product of products) {
			const category = getProductCategory(product);
			if (category) unique.add(category);
		}
		return Array.from(unique).sort((a, b) => a.localeCompare(b));
	}, [products]);

	const brands = React.useMemo(() => {
		const unique = new Set<string>();
		for (const product of products) {
			const brand = getProductBrand(product);
			if (brand) unique.add(brand);
		}
		return Array.from(unique).sort((a, b) => a.localeCompare(b));
	}, [products]);

	const filteredProducts = React.useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();

		const next = products.filter((product) => {
			if (!includesQuery(product, normalizedQuery)) return false;

			if (selectedCategory !== 'all' && getProductCategory(product) !== selectedCategory) {
				return false;
			}

			if (selectedBrand !== 'all' && getProductBrand(product) !== selectedBrand) {
				return false;
			}

			return true;
		});

		if (sortBy === 'relevance') return next;

		return [...next].sort((a, b) => {
			if (sortBy === 'name-asc') {
				return getProductName(a).localeCompare(getProductName(b));
			}

			if (sortBy === 'name-desc') {
				return getProductName(b).localeCompare(getProductName(a));
			}

			if (sortBy === 'price-asc') {
				const aPrice = getProductPrice(a);
				const bPrice = getProductPrice(b);
				if (aPrice === null && bPrice === null) return 0;
				if (aPrice === null) return 1;
				if (bPrice === null) return -1;
				return aPrice - bPrice;
			}

			if (sortBy === 'price-desc') {
				const aPrice = getProductPrice(a);
				const bPrice = getProductPrice(b);
				if (aPrice === null && bPrice === null) return 0;
				if (aPrice === null) return 1;
				if (bPrice === null) return -1;
				return bPrice - aPrice;
			}

			return getProductUpdatedAt(b) - getProductUpdatedAt(a);
		});
	}, [products, query, selectedCategory, selectedBrand, sortBy]);

	React.useEffect(() => {
		onProductsChange?.(filteredProducts);
	}, [filteredProducts, onProductsChange]);

	const handleReset = () => {
		setQuery('');
		setSelectedCategory('all');
		setSelectedBrand('all');
		setSortBy('relevance');
	};

	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<Stack spacing={2}>
				<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
					Find products
				</Typography>

				<Grid container spacing={1.5}>
					<Grid size={{ xs: 12, md: 4 }}>
						<TextField
							label="Search"
							placeholder="Name, description, category, brand"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							fullWidth
						/>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<TextField
							select
							label="Category"
							value={selectedCategory}
							onChange={(event) => setSelectedCategory(event.target.value)}
							fullWidth
						>
							<MenuItem value="all">All categories</MenuItem>
							{categories.map((category) => (
								<MenuItem key={category} value={category}>
									{category}
								</MenuItem>
							))}
						</TextField>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<TextField
							select
							label="Brand"
							value={selectedBrand}
							onChange={(event) => setSelectedBrand(event.target.value)}
							fullWidth
						>
							<MenuItem value="all">All brands</MenuItem>
							{brands.map((brand) => (
								<MenuItem key={brand} value={brand}>
									{brand}
								</MenuItem>
							))}
						</TextField>
					</Grid>

					<Grid size={{ xs: 12, sm: 6, md: 2 }}>
						<TextField
							select
							label="Sort"
							value={sortBy}
							onChange={(event) => setSortBy(event.target.value as T_SortBy)}
							fullWidth
						>
							{SORT_OPTIONS.map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</TextField>
					</Grid>
				</Grid>

				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
					<Button variant="outlined" onClick={handleReset}>
						Reset
					</Button>
					<Chip label={`${filteredProducts.length} shown`} variant="outlined" />
					<Chip label={`${products.length} total`} variant="outlined" />
				</Box>
			</Stack>
		</Paper>
	);
}