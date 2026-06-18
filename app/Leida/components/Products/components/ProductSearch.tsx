'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Typography,
} from '@mui/material';
import { navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';


const ProductSearch = () => {

	const dispatch = useDispatch();
	const router = useRouter();

	return (
		<>ProductSearch</>
	);
};

export default ProductSearch;
