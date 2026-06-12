import React from 'react';
import { usePathname } from 'next/navigation';
import { 
	Grid,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import {
	PractitionerNew,
	useLeidaBus,
	PractitionerDash,
} from '../../../Leida';
import { setNXAdmin } from '../../../NXAdmin';


const Practitioners = () => {

	const dispatch = useDispatch();
	const pathname = usePathname();
	const uuid = pathname?.split('/').pop() ?? '';
	const route = uuid ? `practitioners/${uuid}` : '';
	const { loading, error, data } = useLeidaBus(route);

	React.useEffect(() => {
		dispatch(setNXAdmin('header', {
			title: 'Practitioners',
			icon: 'practitioner',
		}));
	}, [dispatch]);

	return <>
		<Grid container spacing={2} sx={{ mb: 2 }}>
			<Grid size={{
				xs: 12,
				md: 6,
			}}>
				<PractitionerNew />
			</Grid>
			<Grid size={{
				xs: 12,
				md: 6,
			}}>
				<PractitionerDash />
			</Grid>
		</Grid>
		
	</>;
};

export default Practitioners;
