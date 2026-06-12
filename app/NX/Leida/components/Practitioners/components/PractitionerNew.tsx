"use client";
import * as React from 'react';
import {
	Alert,
	Box,
	Button,
} from '@mui/material';
import { Icon } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import {
	initSupabase,
	fetchSupabaseRows,
	saveSupabaseRecord,
	useSupabase,
} from '../../../../Leida';
import { Editable } from '../../../../NXAdmin';

const PRACTITIONERS_TABLE = 'practitioners';

const PractitionerNew = () => {
	const dispatch = useDispatch();
	const supabase = useSupabase();
	const [inviteEmail, setInviteEmail] = React.useState('');
	const [createLoading, setCreateLoading] = React.useState(false);
	const [createError, setCreateError] = React.useState<string | null>(null);
	const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);
	const [emailFocusKey, setEmailFocusKey] = React.useState(0);

	const focusEmailField = React.useCallback(() => {
		setEmailFocusKey((value) => value + 1);
	}, []);

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
			setCreateError('A practitioner must have an email');
			focusEmailField();
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
			focusEmailField();
		} finally {
			setCreateLoading(false);
		}
	}, [dispatch, focusEmailField, inviteEmail]);

	return (
		<Box sx={{  mx: 2 }}>

			{createError || createSuccess ? (
				<Box sx={{ mb: 2 }}>
					{createError && <Alert severity="error">{createError}</Alert>}
					{createSuccess && <Alert severity="success">{createSuccess}</Alert>}
				</Box>
			) : null}

			<Editable
				key={`invite-email-${emailFocusKey}`}
				label="Email"
				variant="standard"
				value={inviteEmail}
				onChange={setInviteEmail}
				disabled={createLoading}
				autoFocus
				placeholder="name@example.com"
			/>
			<Button
				sx={{my: 3}}
				variant="contained"
				endIcon={<Icon icon="practitioner-add" />}
				onClick={handleCreatePractitioner}
				disabled={createLoading}
			>
				{createLoading ? 'Adding...' : 'Add Practitioner'}
			</Button>
		</Box>
	);
};

export default PractitionerNew;
