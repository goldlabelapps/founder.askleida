import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
	Button,
	Grid,
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
		<Grid container spacing={2} sx={{ mb: 2 }}>
			<Grid size={{
				xs: 12,
			}}>
				<Button
					fullWidth
					variant="outlined"
					startIcon={<Icon icon="practitioner-add" />}
					onClick={handleNewPractitioner}
				>
					New Practitioner
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
