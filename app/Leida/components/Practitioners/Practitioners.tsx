import React from 'react';
import { useRouter } from 'next/navigation';
import { 
	Box,
	Paper,
	Stack,
	Typography,
	Fab,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { Icon, navigateTo } from '../../../NX/DesignSystem';
import {
	setLeida,
	initPractitioners,
	usePractitioners,
	PractitionerList,
	MightyButton,
} from '../../../Leida';

const Practitioners = () => {

	const dispatch = useDispatch();
	const router = useRouter();
	const practitioners = usePractitioners();

	React.useEffect(() => {
		if (typeof practitioners === 'undefined') {
			dispatch(initPractitioners());
		}
	}, [dispatch, practitioners]);

	React.useEffect(() => {
		dispatch(setLeida('header', {
			title: 'Practitioners',
			icon: 'practitioner',
		}));
	}, [dispatch]);

	const handleNewPractitioner = () => {
		dispatch(navigateTo(router, '/practitioners/new'));
	}

	return <>
			<Box sx={{ p: 2 }}>
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<Typography variant="h5">
								Practitioners
							</Typography>
							<MightyButton
								kind="icon"
								// variant="contained"
								color="primary"
								onClick={handleNewPractitioner}
								icon="add"
							>
								Add
							</MightyButton>

						</Box>
					</Stack>
				</Paper>
				<PractitionerList />
			</Box>		
	</>;
};

export default Practitioners;
