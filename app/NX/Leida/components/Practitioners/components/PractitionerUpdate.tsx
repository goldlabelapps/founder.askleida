'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
	Paper, 
	Grid,
	Stack,
	LinearProgress,
	Typography,
	Button,
	IconButton,
	Box,
} from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { Icon, ConfirmAction } from '../../../../DesignSystem';
import { 
	fetchLeida,
	useLeidaBus,
	deletePractitioner,
	
} from '../../../../Leida';
import { 
	OptionSelect,
	setNXAdmin, 
	Editable, 
	AvatarUpload,
} from '../../../../NXAdmin';

const ACCESS_LEVEL_OPTIONS = [
	{ index: 3, label: 'Founder' },
	{ index: 2, label: 'Practitioner' },
	{ index: 1, label: 'Client' }
];

const PractitionerUpdate = () => {

	const dispatch = useDispatch();
	const pathname = usePathname();
	const uuid = pathname?.split('/').pop() ?? '';
	const route = uuid ? `practitioners/${uuid}` : '';
	const { loading, error, data } = useLeidaBus(route);
	const practitioner = data?.[0]?.data;
	const currentAvatar = typeof practitioner?.avatar === 'string' ? practitioner.avatar : undefined;
	const currentDisplayName = typeof practitioner?.display_name === 'string' ? practitioner.display_name : '';
	const currentClinic = typeof practitioner?.clinic === 'string' ? practitioner.clinic : '';
	const currentAccessLevel = (() => {
		const value = practitioner?.access_level;
		if (typeof value === 'number' && value >= 0 && value <= 5) {
			return String(value);
		}
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (/^[0-5]$/.test(trimmed)) {
				return trimmed;
			}
		}
		return '';
	})();
	const [displayName, setDisplayName] = React.useState(currentDisplayName);
	const [clinic, setClinic] = React.useState(currentClinic);
	const [accessLevel, setAccessLevel] = React.useState(currentAccessLevel);
	const [avatarChanged, setAvatarChanged] = React.useState(false);
	const [savingDisplayName, setSavingDisplayName] = React.useState(false);
	const [displayNameError, setDisplayNameError] = React.useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const hasDisplayNameChanges = displayName.trim() !== currentDisplayName;
	const hasClinicChanges = clinic.trim() !== currentClinic;
	const hasAccessLevelChanges = accessLevel !== currentAccessLevel;
	const canSave = hasDisplayNameChanges || hasClinicChanges || hasAccessLevelChanges || avatarChanged;

	React.useEffect(() => {
		setDisplayName(currentDisplayName);
	}, [currentDisplayName]);

	React.useEffect(() => {
		setClinic(currentClinic);
	}, [currentClinic]);

	React.useEffect(() => {
		setAccessLevel(currentAccessLevel);
	}, [currentAccessLevel]);

	const handleDelete = () => {
		setConfirmOpen(true);
	};

	const router = useRouter();
	const [deleting, setDeleting] = React.useState(false);

	const handleConfirmDelete = async () => {
		try {
			setConfirmOpen(false);
			setDeleting(true);
			await dispatch(deletePractitioner(uuid) as any);
			// Redirect to practitioners list after successful deletion
			router.push('/practitioners');
		} catch (error) {
			console.error('Delete failed:', error);
		} finally {
			setDeleting(false);
		}
	};

	const handleCloseConfirm = () => {
		setConfirmOpen(false);
	};

	const handleSaveDisplayName = async () => {
		if (!uuid) return;
		if (!canSave) return;

		if (!hasDisplayNameChanges && avatarChanged) {
			setAvatarChanged(false);
			return;
		}

		setDisplayNameError(null);
		setSavingDisplayName(true);

		if (!accessLevel) {
			setDisplayNameError('Access Level is required.');
			setSavingDisplayName(false);
			return;
		}

		try {
			const res = await fetch('/api/practitioners', {
				method: 'PATCH',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					practitioner_id: uuid,
					data: {
						display_name: displayName.trim(),
						clinic: clinic.trim(),
						access_level: Number(accessLevel),
					},
				}),
			});

			let json: any = null;
			try {
				json = await res.json();
			} catch {
				json = null;
			}

			if (!res.ok) {
				throw new Error(json?.message || `Failed to update display name (${res.status})`);
			}

			dispatch(fetchLeida(route));
			setAvatarChanged(false);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setDisplayNameError(msg);
		} finally {
			setSavingDisplayName(false);
		}
	};

	const handleAvatarSuccess = () => {
		setAvatarChanged(true);
		dispatch(fetchLeida(route));
	};


	React.useEffect(() => {
		if (!route) return;
		dispatch(fetchLeida(route));
	}, [dispatch, route]);

	React.useEffect(() => {
		dispatch(setNXAdmin('header', {
			title: data?.[0]?.data?.display_name || 'Practitioner',
			icon: 'practitioner',
		}));
	}, [dispatch, data]);

	return (
		<Paper variant="outlined" sx={{ p: 1.5 }}>
			<>
				{/* Header with delete button */}
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{ mb: 1 }}
				>
					<Typography variant="caption">
						{data?.[0]?.title || 'email'}
					</Typography>

					<IconButton 
						color="primary"
						disabled={deleting}
						onClick={handleDelete}
					>
						<Icon icon="delete" />
					</IconButton>
				</Stack>
				
				{deleting ? (
					<Stack spacing={1} sx={{ pt: 0.5 }}>
						<LinearProgress />
						<Typography variant="body2" color="text.secondary">
							Deleting practitioner and related account data...
						</Typography>
					</Stack>
				) : (
					<>
						{loading && <Typography variant="body2">Loading...</Typography>}
						{error && <Typography variant="body2" color="error">Error: {error}</Typography>}
						{!loading && !error && (
							<>
							<Grid container spacing={2} alignItems="center">
								
								<Grid size={{
									xs: 12,
									sm: 6,
								}}>
									<Box sx={{ my: 1 }}>
										<Editable
											label="Name"
											value={displayName}
											variant="filled"
											onChange={setDisplayName}
										/>
									</Box>
									<Box sx={{ my: 1 }}>
										<Editable
											label="Clinic"
											value={clinic}
											variant="filled"
											onChange={setClinic}
										/>
									</Box>
									<Box sx={{ my: 1 }}>
										<OptionSelect
											label="Access Level"
											options={ACCESS_LEVEL_OPTIONS}
											value={accessLevel}
											onChange={setAccessLevel}
											disabled={savingDisplayName}
										/>
									</Box>
								</Grid>

								<Grid size={{
									xs: 12,
									sm: 6,
								}}>
									<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100%' }}>
										<AvatarUpload
											practitionerId={uuid}
											currentAvatar={currentAvatar}
											displayName={currentDisplayName || data?.[0]?.title || 'Practitioner'}
											onSuccess={handleAvatarSuccess}
										/>
									</Box>
								</Grid>


								<Grid size={{
									xs: 12,
								}}>
									<Box sx={{
										display: 'flex',
										justifyContent: 'flex-end',
									}}>
										<Button
											variant="contained"
											startIcon={<Icon icon="save" />}
											color="primary"
											sx={{ my: 2 }}
											onClick={handleSaveDisplayName}
											disabled={savingDisplayName || !canSave}
										>
											{savingDisplayName ? 'Saving...' : 'Save'}
										</Button>
									</Box>
								</Grid>
							</Grid>
								
								{displayNameError ? (
									<Typography variant="body2" color="error">{displayNameError}</Typography>
								) : null}
							</>
						)}
					</>
				)}
			</>

			{/* Confirm Delete Dialog */}
			<ConfirmAction
				open={confirmOpen}
				icon="delete"
				title="Delete Practitioner"
				body="Are you sure you want to delete this practitioner? This action cannot be undone."
				handleConfirm={handleConfirmDelete}
				handleClose={handleCloseConfirm}
			/>
		</Paper>
	);
};

export default PractitionerUpdate;
