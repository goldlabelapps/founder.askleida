"use client";
import * as React from 'react';
import { Alert, Stack } from '@mui/material';
import { BlockingOverlay } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import { fetchLeida, useLeidaBus } from '../../../../Leida';
import { parsePractitionerData } from '../../../lib/parsePractitionerData';
import type { T_PractitionerRecord } from '../../../types.d';
import PractitionerCard from './PractitionerCard';

const PRACTITIONERS_ROUTE = '/api/practitioners';

function toTime(value: unknown): number {
	if (typeof value !== 'string') return 0;
	const time = Date.parse(value);
	return Number.isNaN(time) ? 0 : time;
}

function getRecordUpdatedTime(record: T_PractitionerRecord | null): number {
	if (!record) return 0;
	const data = parsePractitionerData(record.data);
	return (
		toTime((record as Record<string, unknown>).updatedAt) ||
		toTime(record.updated) ||
		toTime((record as Record<string, unknown>).updated_at) ||
		toTime((data as Record<string, unknown>).updatedAt) ||
		toTime((data as Record<string, unknown>).updated_at)
	);
}

function getRecordCreatedTime(record: T_PractitionerRecord | null): number {
	if (!record) return 0;
	const data = parsePractitionerData(record.data);
	return (
		toTime((record as Record<string, unknown>).createdAt) ||
		toTime(record.created) ||
		toTime((record as Record<string, unknown>).created_at) ||
		toTime((data as Record<string, unknown>).createdAt) ||
		toTime((data as Record<string, unknown>).created_at)
	);
}

const PractitionerList = () => {
	const dispatch = useDispatch();
	const practitionersBus = useLeidaBus(PRACTITIONERS_ROUTE);
	const didRequestRows = React.useRef(false);

	const rows = (Array.isArray(practitionersBus?.data) ? practitionersBus.data : []) as T_PractitionerRecord[];
	const sortedRows = React.useMemo(() => {
		return [...rows]
			.sort((a, b) => {
				const aValue = getRecordUpdatedTime(a) || getRecordCreatedTime(a);
				const bValue = getRecordUpdatedTime(b) || getRecordCreatedTime(b);
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
			<Stack spacing={1}>
				
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
				<BlockingOverlay open={Boolean(practitionersBus?.loading)} label="Loading practitioners..." />
			</Stack>
		</>
	);
};

export default PractitionerList;
