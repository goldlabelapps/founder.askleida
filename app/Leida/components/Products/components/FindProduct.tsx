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
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import {Icon} from '../../../../NX/DesignSystem';
import { getProductBrand } from '../../../lib/getProductBrand';
import { getProductCategory } from '../../../lib/getProductCategory';
import { getProductName } from '../../../lib/getProductName';
import { getProductPrice } from '../../../lib/getProductPrice';
import { getProductUpdatedAt } from '../../../lib/getProductUpdatedAt';
import { includesProductQuery } from '../../../lib/includesProductQuery';
import type { T_FindProductProps, T_Product, T_SortBy } from '../../../types.d';

const SORT_OPTIONS: Array<{ value: T_SortBy; label: string }> = [
	{ value: 'relevance', label: 'Relevance' },
	{ value: 'name-asc', label: 'Name (A-Z)' },
	{ value: 'name-desc', label: 'Name (Z-A)' },
	{ value: 'price-asc', label: 'Price (Low to high)' },
	{ value: 'price-desc', label: 'Price (High to low)' },
	{ value: 'updated-desc', label: 'Most recent' },
];

export default function FindProduct({
	products,
	onProductsChange,
	viewMode = 'list',
	onViewModeChange,
}: T_FindProductProps) {
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
			if (!includesProductQuery(product, normalizedQuery)) return false;

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
					<Button 
						startIcon={<Icon icon="reset" />}
						variant="outlined" 
						onClick={handleReset}>
						Reset
					</Button>
					
					<Chip 
						color="primary" 
						label={`Showing ${filteredProducts.length} of ${products.length}`} 
					/>

					<Box sx={{ ml: 'auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
						<ToggleButtonGroup
							color="primary"
							value={viewMode}
							exclusive
							onChange={(_, newMode) => {
								if (newMode !== null) onViewModeChange?.(newMode);
							}}
							size="small"
						>
							<ToggleButton value="card">Card</ToggleButton>
							<ToggleButton value="list">List</ToggleButton>
						</ToggleButtonGroup>
					</Box>
				</Box>
			</Stack>
		</Paper>
	);
}