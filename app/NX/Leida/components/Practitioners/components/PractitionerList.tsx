"use client";
import * as React from 'react';
import { Alert, Box, LinearProgress, Stack } from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { initSupabase } from '../../Supabase/actions/initSupabase';
import { fetchSupabaseRows } from '../../Supabase/actions/fetchSupabaseRows';
import { useSupabase } from '../../Supabase/hooks/useSupabase';
import { PractitionerNew } from '../../../../Leida';
import PractitionerCard, { T_PractitionerRecord } from './PractitionerCard';

const PRACTITIONERS_TABLE = 'practitioners';

const PractitionerList = () => {
	const dispatch = useDispatch();
	const supabase = useSupabase();
	const didRequestRows = React.useRef(false);

	const rowsState = supabase?.rowsByTable?.[PRACTITIONERS_TABLE] || null;
	const rows = (Array.isArray(rowsState?.rows) ? rowsState.rows : []) as T_PractitionerRecord[];
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
		if (!supabase?.initted) {
			dispatch(initSupabase());
		}
	}, [dispatch, supabase?.initted]);

	React.useEffect(() => {
		if (!supabase?.initted) return;
		if (didRequestRows.current) return;
		dispatch(fetchSupabaseRows({ table: PRACTITIONERS_TABLE }));
		didRequestRows.current = true;
	}, [dispatch, supabase?.initted]);

	return (
		<>
		{/* <PractitionerNew /> */}
			<Stack spacing={1.5}>
				<Box sx={{ height: 12 }}>
					{rowsState?.loading && <LinearProgress />}
				</Box>
				{rowsState?.error && <Alert severity="error">{rowsState.error}</Alert>}
				{!rowsState?.loading && sortedRows.length === 0 && (
					<Alert severity="info">No practitioners found.</Alert>
				)}
				{sortedRows.map((row, index) => {
					const key = typeof row?.practitioner_id === 'string' && row.practitioner_id
						? row.practitioner_id
						: `practitioner-${index}`;
					return <PractitionerCard key={key} practitioner={row} />;
				})}
			</Stack>
		</>
	);
};

export default PractitionerList;
