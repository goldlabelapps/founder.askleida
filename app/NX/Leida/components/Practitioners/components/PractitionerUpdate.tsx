'use client';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Paper, Stack } from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { fetchLeida } from '../../../../Leida/actions/fetchLeida';
import { useLeidaBus } from '../../../../Leida/hooks/useLeida';

const PractitionerUpdate = () => {
	const dispatch = useDispatch();
	const pathname = usePathname();
	const uuid = pathname?.split('/').pop() ?? '';
	const route = uuid ? `practitioners/${uuid}` : '';
	const { loading, error, data } = useLeidaBus(route);

	React.useEffect(() => {
		if (!route) return;
		dispatch(fetchLeida(route));
	}, [dispatch, route]);

	return (
		<Paper variant="outlined" sx={{ p: 1.5 }}>
			<Stack spacing={1}>
				<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
					{loading && 'Loading...'}
					{error && `Error: ${error}`}
					{!loading && !error && JSON.stringify(data, null, 2)}
				</pre>
			</Stack>
		</Paper>
	);
};

export default PractitionerUpdate;
