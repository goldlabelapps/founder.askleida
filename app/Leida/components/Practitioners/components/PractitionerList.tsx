"use client";
import * as React from 'react';
import { Alert, Box, LinearProgress, Stack } from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { fetchLeida, useLeidaBus } from '../../../../Leida';
import type { T_PractitionerRecord } from '../../../types.d';
import PractitionerCard from './PractitionerCard';

const PRACTITIONERS_ROUTE = '/api/practitioners';

const PractitionerList = () => {
	const dispatch = useDispatch();
	const practitionersBus = useLeidaBus(PRACTITIONERS_ROUTE);
	const didRequestRows = React.useRef(false);

	const rows = (Array.isArray(practitionersBus?.data) ? practitionersBus.data : []) as T_PractitionerRecord[];
	const sortedRows = React.useMemo(() => {
		return [...rows]
			.filter((row) => {
				const accessLevel = row?.data && typeof row.data === 'object' 
					? (row.data as Record<string, unknown>).access_level 
					: null;
				return accessLevel !== 4;
			})
			.sort((a, b) => {
				const aTime = Date.parse(typeof a?.updated === 'string' ? a.updated : '');
				const bTime = Date.parse(typeof b?.updated === 'string' ? b.updated : '');
				const aValue = Number.isNaN(aTime) ? 0 : aTime;
				const bValue = Number.isNaN(bTime) ? 0 : bTime;
				return bValue - aValue;
			});
	}, [rows]);

	React.useEffect(() => {
		if (didRequestRows.current) return;
		if (rows.length > 0) {
			didRequestRows.current = true;
			return;
		}
		dispatch(fetchLeida(PRACTITIONERS_ROUTE));
		didRequestRows.current = true;
	}, [dispatch, rows.length]);

	return (
		<>
			<Stack spacing={1.5}>
				
				{practitionersBus?.error && <Alert severity="error">{practitionersBus.error}</Alert>}
				{!practitionersBus?.loading && sortedRows.length === 0 && (
					<Alert severity="info">No practitioners found.</Alert>
				)}
				{sortedRows.map((row, index) => {
					const key = typeof row?.practitioner_id === 'string' && row.practitioner_id
						? row.practitioner_id
						: `practitioner-${index}`;
					return <PractitionerCard key={key} practitioner={row} />;
				})}
				<Box sx={{ height: 12 }}>
					{practitionersBus?.loading && <LinearProgress />}
				</Box>
			</Stack>
		</>
	);
};

export default PractitionerList;
