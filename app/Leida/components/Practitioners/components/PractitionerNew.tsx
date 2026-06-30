"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Box,
	Typography,
} from '@mui/material';
import { Icon, navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import {
	createPractitioner,
	setLeida,
	MightyButton,
} from '../../../../Leida';
import { Editable } from '../../../../NX/NXAdmin';
import { setFeedback } from '../../../../NX/DesignSystem';
import { isValidEmail } from '../../../lib/isValidEmail';

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

		if (!isValidEmail(email)) {
			dispatch(setFeedback({
				title: 'Enter a valid email address',
				severity: 'error',
			}));
			setCreateError('Enter a valid email address');
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
						Send a Supabase invite to a new Practitioner.<br />They have to set a password to complete account setup before onboarding
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
							placeholder="Name"
						/>
					</Box>
					<Box sx={{ height: 24 }} />
					<Box sx={{ maxWidth: 400, width: '100%' }}>
						<Editable
							key={`invite-email-${emailFocusKey}`}
							startAdornment={"email"}
							variant="filled"
							value={inviteEmail}
							onChange={setInviteEmail}
							disabled={createLoading}
							placeholder="name@example.com"
						/>
					</Box>
					<Box sx={{ height: 32 }} />
					<MightyButton
						
						variant="outlined"
						endIcon="send"
						onClick={handleCreatePractitioner}
						disabled={createLoading}
					>
						{createLoading ? 'Inviting...' : 'Invite Practitioner'}
					</MightyButton>
					
				</Box>
				
			</Box>
		
		</>
	);
};

export default PractitionerNew;
