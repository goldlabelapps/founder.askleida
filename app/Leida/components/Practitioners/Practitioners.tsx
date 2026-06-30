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
			<Box >
				<Box sx={{ display: 'flex' }}>
					<Box sx={{flexGrow:1}}/>
					<Box>
						<MightyButton
							kind="button"
							variant="outlined"
							color="primary"
							onClick={handleNewPractitioner}
							endIcon="add"
						>
							New
						</MightyButton>
					</Box>
					<Box sx={{ height: 12 }} />
				</Box>
				<Box sx={{ height: 12 }} />
				<PractitionerList />
			</Box>		
	</>;
};

export default Practitioners;
