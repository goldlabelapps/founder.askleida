"use client";
import * as React from 'react';
import {
	Alert,
	Box,
	Button,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { Icon } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { initSupabase } from '../../Supabase/actions/initSupabase';
import { fetchSupabaseRows } from '../../Supabase/actions/fetchSupabaseRows';
import { saveSupabaseRecord } from '../../Supabase/actions/saveSupabaseRecord';
import { useSupabase } from '../../Supabase/hooks/useSupabase';

const PRACTITIONERS_TABLE = 'practitioners';

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
	const [inviteEmail, setInviteEmail] = React.useState('');
	const [createLoading, setCreateLoading] = React.useState(false);
	const [createError, setCreateError] = React.useState<string | null>(null);
	const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!supabase?.initted) {
			dispatch(initSupabase());
		}
	}, [dispatch, supabase?.initted]);

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
			await dispatch(fetchSupabaseRows({ table: PRACTITIONERS_TABLE }));
			setCreateSuccess(`Invited ${email} and refreshed practitioners.`);
			setInviteEmail('');
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setCreateError(msg || 'Failed to create practitioner');
		} finally {
			setCreateLoading(false);
		}
	}, [dispatch, inviteEmail]);

	return (
		<Box sx={{ p: 2 }}>
			<Stack spacing={2}>
				<Paper variant="outlined" sx={{ p: 2 }}>
					<Stack spacing={1.5}>
						<Typography variant="body1" sx={{ flexShrink: 0 }}>
							Invite practitioner. They receive an email to set password and activate their account
						</Typography>
						<Box sx={{ my: 1 }}>
							{createError && <Alert severity="warning">{createError}</Alert>}
							{createSuccess && <Alert severity="info">{createSuccess}</Alert>}
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
