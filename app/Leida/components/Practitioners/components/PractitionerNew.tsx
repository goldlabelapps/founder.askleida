"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Paper,
	Typography,
} from '@mui/material';
import { Icon, navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import {
	createPractitioner,
	initSupabase,
	setLeida,
	useSupabase,
} from '../../../../Leida';
import { Editable } from '../../../../NX/NXAdmin';

const PractitionerNew = () => {
	const dispatch = useDispatch();
	const router = useRouter();
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

	React.useEffect(() => {
		dispatch(setLeida('header', {
			title: 'Invite Practitioner',
			icon: 'practitioner-add',
		}));
	}, [dispatch]);
		
	const handleCreatePractitioner = React.useCallback(async () => {
		setCreateError(null);
		setCreateSuccess(null);

		const email = inviteEmail.trim().toLowerCase();
		if (!email) {
			setCreateError('Email required');
			focusEmailField();
			return;
		}

		setCreateLoading(true);
		try {
			const response = await dispatch(createPractitioner({ email }));
			// const practitionerId = response?.practitionerId;
			dispatch(navigateTo(router, '/practitioners'));
			// if (practitionerId) {
			// } else {
			// 	dispatch(navigateTo(router, '/practitioners'));
			// }
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setCreateError(msg || 'Failed to create practitioner');
			focusEmailField();
		} finally {
			setCreateLoading(false);
		}
	}, [dispatch, router, focusEmailField, inviteEmail]);

	return (
		<>
			<Paper variant="outlined" sx={{ p: 1.5, width: '100%' }}>
				<Box sx={{ mx: 0 }}>
					
					{createError || createSuccess ? (
						<Box sx={{ mb: 2 }}>
							{createError && <Alert severity="error">{createError}</Alert>}
							{createSuccess && <Alert severity="success">{createSuccess}</Alert>}
						</Box>
					) : null}
					
					<Editable
						key={`invite-email-${emailFocusKey}`}
						startAdornment={"email"}
						variant="outlined"
						value={inviteEmail}
						onChange={setInviteEmail}
						disabled={createLoading}
						autoFocus
						placeholder="name@example.com"
					/>
					
					<Button
						sx={{mt: 2}}
						fullWidth
						variant="contained"
						endIcon={<Icon icon="send" />}
						onClick={handleCreatePractitioner}
						disabled={createLoading}
						size="large"
					>
						{createLoading ? 'Sending...' : 'Send Invite'}
					</Button>
					
				</Box>
				
			</Paper>
		
		</>
	);
};

export default PractitionerNew;
