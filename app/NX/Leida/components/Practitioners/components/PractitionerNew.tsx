"use client";
import * as React from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { Icon } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { initSupabase } from '../../Supabase/actions/initSupabase';
import { saveSupabaseRecord } from '../../Supabase/actions/saveSupabaseRecord';
import { useSupabase } from '../../Supabase/hooks/useSupabase';

type T_PractitionerRecord = {
	practitioner_id?: string;
	name?: string;
	title?: string;
	updated?: string;
	created?: string;
	[key: string]: any;
};

const PractitionerNew = () => {
	const dispatch = useDispatch();
	const supabase = useSupabase();
	const [practitioners, setPractitioners] = React.useState<T_PractitionerRecord[]>([]);
	const [practitionersLoading, setPractitionersLoading] = React.useState(false);
	const [practitionersError, setPractitionersError] = React.useState<string | null>(null);
	const [inviteEmail, setInviteEmail] = React.useState('');
	const [createLoading, setCreateLoading] = React.useState(false);
	const [createError, setCreateError] = React.useState<string | null>(null);
	const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);

	const loadPractitioners = React.useCallback(async () => {
		setPractitionersLoading(true);
		setPractitionersError(null);
		try {
			const res = await fetch('/api/practitioners', {
				method: 'GET',
				headers: { Accept: 'application/json' },
			});
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				const message = typeof json?.message === 'string'
					? json.message
					: `Failed to fetch practitioners (${res.status})`;
				throw new Error(message);
			}
			const data = Array.isArray(json?.data) ? json.data : [];
			setPractitioners(data as T_PractitionerRecord[]);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setPractitionersError(msg || 'Failed to fetch practitioners');
		} finally {
			setPractitionersLoading(false);
		}
	}, []);

	React.useEffect(() => {
		if (!supabase?.initted) {
			dispatch(initSupabase());
		}
	}, [dispatch, supabase?.initted]);

	React.useEffect(() => {
		loadPractitioners();
	}, [loadPractitioners]);

	const handleCreatePractitioner = React.useCallback(async () => {
		setCreateError(null);
		setCreateSuccess(null);

		const email = inviteEmail.trim().toLowerCase();
		if (!email) {
			setCreateError('Email is required');
			return;
		}

		setCreateLoading(true);
		try {
			await dispatch(saveSupabaseRecord({
				resource: 'practitioner-onboard',
				email,
				user_metadata: { invited_from: 'leida-supabase-module' },
			}));
			await loadPractitioners();
			setCreateSuccess(`Invited ${email} and created practitioner record.`);
			setInviteEmail('');
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setCreateError(msg || 'Failed to create practitioner');
		} finally {
			setCreateLoading(false);
		}
	}, [dispatch, inviteEmail, loadPractitioners]);

	return (
		<Box sx={{ p: 2 }}>
			<Stack spacing={2}>
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Typography variant="body1" sx={{ flexShrink: 0 }}>
							Create a Supabase Auth invite. User receives an email to set password and activate their account.
						</Typography>
						<Box sx={{ my: 1 }}>
							{createError && <Alert severity="error">{createError}</Alert>}
							{createSuccess && <Alert severity="success">{createSuccess}</Alert>}
						</Box>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
							<TextField
								label="Email"
								type="email"
								value={inviteEmail}
								onChange={(event) => setInviteEmail(event.target.value)}
								disabled={createLoading}
							/>
							<Button
								variant="outlined"
								endIcon={<Icon icon="send" />}
								onClick={handleCreatePractitioner}
								disabled={createLoading}
								size="large"
							>
								{createLoading ? 'Inviting...' : 'Send Invite'}
							</Button>
						</Stack>
					</Stack>
				</Paper>

				
			</Stack>
		</Box>
	);
};

export default PractitionerNew;
