import React from 'react';
import { useRouter } from 'next/navigation';
import {
	Grid,
} from '@mui/material';
import { Icon, navigateTo } from '../../../../NX/DesignSystem'
import { useDispatch } from '../../../../NX/Uberedux';
import { DashCard } from '../../../';


const DashSurface = () => {

	const dispatch = useDispatch();
	const router = useRouter();

	const handleCardClick = (route: string) => {
		dispatch(navigateTo(router, route));
	};

	return (
		<Grid container spacing={2}>
			<Grid size={{ xs: 12 }}>
				<DashCard
					title="Supabase"
					description="Postgres database and authentication"
					icon={'supabase'}
					cta={() => handleCardClick('/supabase')}
				/>
			</Grid>

			<Grid size={{ xs: 12 }}>
				<DashCard
					title="AWIN"
					description="Affiliate marketing data"
					icon={'awin'}
					cta={() => handleCardClick('/products/awin')}
				/>
			</Grid>

			<Grid size={{ xs: 12 }}>
				<DashCard
					title="Claude"
					description="AI assistant for natural language processing"
					icon={'claude'}
					cta={() => handleCardClick('/claude')}
				/>
			</Grid>
		</Grid>
	);
};

export default DashSurface;
