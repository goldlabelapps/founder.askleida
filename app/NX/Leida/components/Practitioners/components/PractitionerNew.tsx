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
import { Icon, navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import {
	createPractitioner,
	initSupabase,
	useSupabase,
} from '../../../../Leida';
import { Editable, setNXAdmin } from '../../../../NXAdmin';

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
		dispatch(setNXAdmin('header', {
			title: 'Add Practitioner',
			icon: 'practitioner',
		}));
	}, [dispatch]);
		
	const handleCreatePractitioner = React.useCallback(async () => {
		setCreateError(null);
		setCreateSuccess(null);

		const email = inviteEmail.trim().toLowerCase();
		if (!email) {
			setCreateError('Practitioners need emails');
			focusEmailField();
			return;
		}

		setCreateLoading(true);
		try {
			const response = await dispatch(createPractitioner({ email }));
			const practitionerId = response?.practitionerId;

			if (practitionerId) {
				setCreateSuccess(`practitionerId ${practitionerId} created`);
			} else {
				setCreateSuccess(`email ${email} created`);
				setInviteEmail('');
			}
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
			{createError || createSuccess ? (
				<Box sx={{ mb: 2 }}>
					{createError && <Alert severity="error">{createError}</Alert>}
					{createSuccess && <Alert severity="success">{createSuccess}</Alert>}
				</Box>
			) : null}
		
			<Paper variant="outlined" sx={{ p: 1.5, width: '100%' }}>
				<Box sx={{ mx: 0 }}>
					<Editable
						key={`invite-email-${emailFocusKey}`}
						label="New Practitioner's Email"
						startAdornment={"email"}
						variant="standard"
						value={inviteEmail}
						onChange={setInviteEmail}
						disabled={createLoading}
						autoFocus
						placeholder="name@example.com"
					/>
					<Button
						fullWidth
						sx={{my: 3}}
						variant="outlined"
						endIcon={<Icon icon="tick" />}
						onClick={handleCreatePractitioner}
						disabled={createLoading}
					>
						{createLoading ? 'Adding...' : 'Add'}
					</Button>
					
				</Box>
				<Typography 
					variant="body1" 
					sx={{ m: 0 }}>
					Just enter their email. They receive an email to set up their account. They'll be asked to create a password and complete onboarding by creating their first client
				</Typography>
			</Paper>
		
		</>
	);
};

export default PractitionerNew;
