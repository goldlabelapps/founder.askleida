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
	setLeida,
} from '../../../../Leida';
import { Editable } from '../../../../NX/NXAdmin';
import { setFeedback } from '../../../../NX/DesignSystem';

const PractitionerNew = () => {
	const dispatch = useDispatch();
	const router = useRouter();
	const [inviteName, setInviteName] = React.useState('');
	const [inviteEmail, setInviteEmail] = React.useState('');
	const [createLoading, setCreateLoading] = React.useState(false);
	const [createError, setCreateError] = React.useState<string | null>(null);
	const [createSuccess, setCreateSuccess] = React.useState<string | null>(null);
	const [nameFocusKey, setNameFocusKey] = React.useState(0);
	const [emailFocusKey, setEmailFocusKey] = React.useState(0);

	const focusNameField = React.useCallback(() => {
		setNameFocusKey((value) => value + 1);
	}, []);

	const focusEmailField = React.useCallback(() => {
		setEmailFocusKey((value) => value + 1);
	}, []);

	React.useEffect(() => {
		dispatch(setLeida('header', {
			title: 'Invite Practitioner',
			icon: 'practitioner-add',
		}));
	}, [dispatch]);
		
	const handleCreatePractitioner = React.useCallback(async () => {
		setCreateError(null);
		setCreateSuccess(null);

		const name = inviteName.trim();
		const email = inviteEmail.trim().toLowerCase();
		if (!name) {
			dispatch(setFeedback({
				title: 'Name required',
				severity: 'error',
			}));
			setCreateError('Name required');
			focusNameField();
			return;
		}

		if (!email) {
			dispatch(setFeedback({
				title: 'Email required',
				severity: 'error',
			}));
			setCreateError('Email required');
			focusEmailField();
			return;
		}

		setCreateLoading(true);
		try {
			await dispatch(createPractitioner({ email, name }));
			// const practitionerId = response?.practitionerId;
			dispatch(navigateTo(router, '/practitioners'));
			// if (practitionerId) {
			// } else {
			// 	dispatch(navigateTo(router, '/practitioners'));
			// }
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			dispatch(setFeedback({
				title: msg || 'Failed to create practitioner',
				severity: 'error',
			}));
			setCreateError(msg || 'Failed to create practitioner');
			focusEmailField();
		} finally {
			setCreateLoading(false);
		}
	}, [dispatch, focusEmailField, focusNameField, inviteEmail, inviteName, router]);

	return (
		<>
			<Box sx={{ p: 1.5, width: '100%' }}>
				<Box sx={{ mx: 0 }}>
					
					

					<Typography variant="body1">
						Sends a Supabase invite so they can set a password and finish account setup and onboarding
					</Typography>
					<Box sx={{ height: 24 }} />

					

					<Box sx={{ maxWidth: 400, width: '100%' }}>

						{createError || createSuccess ? (
							<Box sx={{ mb: 2 }}>
								{createError && <Alert severity="error">{createError}</Alert>}
								{createSuccess && <Alert severity="success">{createSuccess}</Alert>}
							</Box>
						) : null}
						
						<Editable
							key={`invite-name-${nameFocusKey}`}
							startAdornment={"practitioner"}
							variant="filled"
							value={inviteName}
							onChange={setInviteName}
							disabled={createLoading}
							autoFocus
							placeholder="Name"
						/>
					</Box>
					<Box sx={{ height: 12 }} />
					<Box sx={{ maxWidth: 400, width: '100%' }}>
						<Editable
							key={`invite-email-${emailFocusKey}`}
							startAdornment={"email"}
							variant="filled"
							value={inviteEmail}
							onChange={setInviteEmail}
							disabled={createLoading}
							autoFocus
							placeholder="name@example.com"
						/>
					</Box>
					<Box sx={{ height: 12 }} />
					<Button
						sx={{mt: 2}}
						variant="contained"
						endIcon={<Icon icon="send" />}
						onClick={handleCreatePractitioner}
						disabled={createLoading}
						size="large"
					>
						{createLoading ? 'Inviting...' : 'Invite Practitioner'}
					</Button>
					
				</Box>
				
			</Box>
		
		</>
	);
};

export default PractitionerNew;
