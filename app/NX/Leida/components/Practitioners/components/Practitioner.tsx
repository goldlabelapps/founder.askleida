'use client';
import * as React from 'react';
import {
	Avatar,
	IconButton,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { ConfirmAction, Icon } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { deleteSupabaseRecord } from '../../Supabase/actions/deleteSupabaseRecord';
import { fetchSupabaseAuthUsers } from '../../Supabase/actions/fetchSupabaseAuthUsers';
import { useSupabase } from '../../Supabase/hooks/useSupabase';

type T_PractitionerData = {
	avatar?: string;
	display_name?: string;
	[key: string]: any;
};

export type T_PractitionerRecord = {
	practitioner_id?: string;
	title?: string;
	created?: string;
	updated?: string;
	data?: unknown;
	[key: string]: any;
};

function parsePractitionerData(value: unknown): T_PractitionerData {
	if (!value) return {};
	if (typeof value === 'object') {
		return value as T_PractitionerData;
	}
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			if (parsed && typeof parsed === 'object') {
				return parsed as T_PractitionerData;
			}
		} catch {
			return {};
		}
	}
	return {};
}

function safeDateLabel(value?: string): string {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
}

const Practitioner = ({
	practitioner,
}: {
	practitioner: T_PractitionerRecord;
}) => {
	const dispatch = useDispatch();
	const supabase = useSupabase();
	const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
	const [deleteLoading, setDeleteLoading] = React.useState(false);
	const [deleteError, setDeleteError] = React.useState<string | null>(null);
	const parsedData = parsePractitionerData(practitioner?.data);
	const email = typeof practitioner?.title === 'string' ? practitioner.title : '';
	const displayName = typeof parsedData?.display_name === 'string' && parsedData.display_name.trim()
		? parsedData.display_name.trim()
		: (email || 'Unknown practitioner');
	const avatar = typeof parsedData?.avatar === 'string' ? parsedData.avatar : '';
	const practitionerId = typeof practitioner?.practitioner_id === 'string' ? practitioner.practitioner_id : 'N/A';
	const canDelete = practitionerId !== 'N/A';

	const handleConfirmDelete = React.useCallback(async () => {
		setConfirmDeleteOpen(false);
		if (!canDelete) return;
		setDeleteLoading(true);
		setDeleteError(null);
		try {
			const normalize = (value: unknown): string => (typeof value === 'string' ? value.trim().toLowerCase() : '');
			const identifierCandidates = [
				normalize(email),
				normalize((practitioner as any)?.email),
				normalize((parsedData as any)?.email),
			].filter(Boolean);
			const uniqueIdentifiers = Array.from(new Set(identifierCandidates));
			const localPartCandidates = uniqueIdentifiers
				.filter((value) => !value.includes('@'))
				.map((value) => value.trim())
				.filter(Boolean);

			let authUsers = Array.isArray(supabase?.authUsers) ? supabase.authUsers : [];
			const findAuthUser = (rows: any[]) => rows.find((row: any) => {
				const rowEmail = normalize(row?.email);
				if (!rowEmail) return false;
				if (uniqueIdentifiers.includes(rowEmail)) return true;
				const rowLocalPart = rowEmail.split('@')[0] || '';
				return localPartCandidates.includes(rowLocalPart);
			});

			let authUser = findAuthUser(authUsers);

			if (!authUser) {
				const authTotal = typeof supabase?.authTotal === 'number' ? supabase.authTotal : 0;
				const authPerPage = authTotal > 0 ? Math.min(authTotal, 1000) : 200;
				const authData = await dispatch(fetchSupabaseAuthUsers({ page: 1, perPage: authPerPage }));
				authUsers = Array.isArray(authData?.users) ? authData.users : [];
				authUser = findAuthUser(authUsers);
			}

			if (authUser?.id) {
				await dispatch(deleteSupabaseRecord({ resource: 'auth-user', userId: authUser.id }));
			}

			await dispatch(deleteSupabaseRecord({
				table: 'practitioners',
				match: { practitioner_id: practitionerId },
			}));
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setDeleteError(msg || 'Failed to delete practitioner');
		} finally {
			setDeleteLoading(false);
		}
	}, [canDelete, dispatch, email, parsedData, practitioner, practitionerId, supabase?.authTotal, supabase?.authUsers]);

	return (
		<>
			<Paper variant="outlined" sx={{ p: 1.5 }}>
				<Stack spacing={1}>
					<Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Avatar src={avatar || 'https://app.askleida.com/shared/svg/guest.svg'} alt={displayName} />
							<Stack spacing={0.25}>
								<Typography variant="subtitle2">{displayName}</Typography>
								<Typography variant="body2" color="text.secondary">{email || 'No email'}</Typography>
							</Stack>
						</Stack>
						<IconButton
							aria-label="Delete practitioner"
							onClick={() => setConfirmDeleteOpen(true)}
							disabled={!canDelete || deleteLoading}
							color="primary"
							disabled
						>
							<Icon icon="edit" />
						</IconButton>
					</Stack>
					{deleteError && (
						<Typography variant="caption" color="warning">
							{deleteError}
						</Typography>
					)}
					{/* <Typography variant="caption" color="text.secondary">
						id: {practitionerId}</Typography> */}
				</Stack>
			</Paper>
			<ConfirmAction
				open={confirmDeleteOpen}
				icon="delete"
				title="Delete practitioner?"
				body={`This will delete auth account first, then practitioner record for ${email || displayName}.`}
				handleConfirm={handleConfirmDelete}
				handleClose={() => {
					if (!deleteLoading) setConfirmDeleteOpen(false);
				}}
			/>
		</>
	);
};

export default Practitioner;
