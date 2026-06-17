import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
	Box,
	Button,
	Grid,
	LinearProgress,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { Icon, navigateTo } from '../../../DesignSystem';
import {
	
	useLeidaBus,
	PractitionerList,
} from '../../../Leida';
import { setNXAdmin } from '../../../NXAdmin';


const Practitioners = () => {

	const dispatch = useDispatch();
	const router = useRouter();
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

	const handleNewPractitioner = () => {
		dispatch(navigateTo(router, '/practitioners/new'));
	}

	return <>
		<Grid container spacing={2} sx={{ }}>
			<Grid size={{
				xs: 12,
			}}>
				<Button
					variant="outlined"
					startIcon={<Icon icon="practitioner-add" />}
					onClick={handleNewPractitioner}
				>
					New
				</Button>
			</Grid>
			<Grid size={{
				xs: 12,
			}}>
				<PractitionerList />
			</Grid>
		</Grid>
		
	</>;
};

export default Practitioners;
