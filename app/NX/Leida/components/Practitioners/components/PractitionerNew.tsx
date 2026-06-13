"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Button,
	Paper,
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
			title: 'New Practitioner',
			icon: 'practitioner',
		}));
	}, [dispatch]);
		
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
			const response = await dispatch(createPractitioner({ email }));
			const practitionerId = response?.practitionerId;

			if (practitionerId) {
				setCreateSuccess(`Invited ${email}. Navigating to practitioner profile...`);
				setTimeout(() => {
					router.push(`/practitioners/${practitionerId}`);
				}, 500);
			} else {
				setCreateSuccess(`Invited ${email} and refreshed practitioners.`);
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
				<Box sx={{ display: 'flex', mx: 2 }}>
					<Editable
						key={`invite-email-${emailFocusKey}`}
						label="Add Practitioner"
						variant="standard"
						value={inviteEmail}
						onChange={setInviteEmail}
						disabled={createLoading}
						autoFocus
						placeholder="name@example.com"
					/>
					<Button
						sx={{my: 2, ml: 3}}
						variant="text"
						endIcon={<Icon icon="tick" />}
						onClick={handleCreatePractitioner}
						disabled={createLoading}
					>
						{createLoading ? 'Adding...' : 'Add'}
					</Button>
				</Box>
			</Paper>
		
		</>
	);
};

export default PractitionerNew;
