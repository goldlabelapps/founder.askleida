import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
	Box,
	Button,
	Paper,
	Stack,
	Typography,
	Grid,
	LinearProgress,
	Fab,
} from '@mui/material';
import { useDispatch } from '../../../NX/Uberedux';
import { Icon, navigateTo } from '../../../NX/DesignSystem';
import {
	
	useLeidaBus,
	PractitionerList,
} from '../../../Leida';
import { setNXAdmin } from '../../../NX/NXAdmin';
import { FeedbackBtn } from '../../../NX/Shortcodes';


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


			<Box sx={{ p: 2 }}>
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Stack spacing={2}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							<Typography variant="h4">
								Practitioners
							</Typography>
							<Fab
								color="primary"
								onClick={handleNewPractitioner}
							>
								<Icon icon="practitioner-add" />
							</Fab>
						</Box>
					</Stack>

				<Grid container spacing={2} sx={{}}>
					<Grid size={{
						xs: 12,
					}}
						sx={{
							display: 'flex',
						}}
					>
						<Box sx={{ flexGrow: 1 }} />
						
					</Grid>
					<Grid size={{
						xs: 12,
					}}>
						<PractitionerList />
					</Grid>
				</Grid>
				</Paper>
			</Box>		
	</>;
};

export default Practitioners;
