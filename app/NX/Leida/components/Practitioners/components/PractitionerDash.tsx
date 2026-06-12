"use client";
import * as React from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { initSupabase } from '../../Supabase/actions/initSupabase';
import { fetchSupabaseRows } from '../../Supabase/actions/fetchSupabaseRows';
import { useSupabase } from '../../Supabase/hooks/useSupabase';
import { PractitionerNew } from '../../../../Leida';
import PractitionerCard, { T_PractitionerRecord } from './PractitionerCard';

const PRACTITIONERS_TABLE = 'practitioners';

const PractitionerDash = () => {
	const dispatch = useDispatch();
	const supabase = useSupabase();
	const didRequestRows = React.useRef(false);

	const rowsState = supabase?.rowsByTable?.[PRACTITIONERS_TABLE] || null;
	const rows = (Array.isArray(rowsState?.rows) ? rowsState.rows : []) as T_PractitionerRecord[];

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
		<Box sx={{ p: 2 }}>
			<Stack spacing={1.5}>
				{rowsState?.loading && <CircularProgress size={20} />}
				{rowsState?.error && <Alert severity="error">{rowsState.error}</Alert>}
				{!rowsState?.loading && rows.length === 0 && (
					<Alert severity="info">No practitioners found.</Alert>
				)}
				{rows.map((row, index) => {
					const key = typeof row?.practitioner_id === 'string' && row.practitioner_id
						? row.practitioner_id
						: `practitioner-${index}`;
					return <PractitionerCard key={key} practitioner={row} />;
				})}
			</Stack>
		</Box>
		</>
	);
};

export default PractitionerDash;
