'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Typography,
} from '@mui/material';
import { navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';


const ProductSearch = () => {

	const dispatch = useDispatch();
	const router = useRouter();

	return (
		<>ProductSearch</>
	);
};

export default ProductSearch;
