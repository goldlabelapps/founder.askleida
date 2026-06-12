
import React from 'react';

import { usePathname } from 'next/navigation';
import { Paper, Stack } from '@mui/material';
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
		<PractitionerDash />
	</>;
};

export default Practitioners;
