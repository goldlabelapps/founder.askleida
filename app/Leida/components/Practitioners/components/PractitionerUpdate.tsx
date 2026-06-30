'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
	Paper, 
	Grid,
	Stack,
	Collapse,
	LinearProgress,
	Typography,
	Button,
	IconButton,
	Box,
	Menu,
	MenuItem,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { Icon, ConfirmAction, navigateTo } from '../../../../NX/DesignSystem';
import { 
	fetchLeida,
	setLeida,
	useLeidaBus,
	deletePractitioner,
	updatePractitionerProfile,
	MightyButton,
} from '../../../../Leida';
import { 
	Editable, 
	AvatarUpload,
} from '../../../../NX/NXAdmin';

const ACCESS_LEVEL_OPTIONS = [
	{ index: 4, label: 'Founder' },
	{ index: 3, label: 'QA' },
	{ index: 2, label: 'Practitioner' },
];

const ACCESS_LEVEL_LABELS: Record<string, string> = {
	'4': 'Founder',
	'3': 'QA',
	'2': 'Practitioner',
	'1': 'Client',
};

const PractitionerUpdate = () => {

	const dispatch = useDispatch();
	const pathname = usePathname();
	const uuid = pathname?.split('/').pop() ?? '';
	const route = uuid ? `practitioners/${uuid}` : '';
	const { loading, error, data } = useLeidaBus(route);
	const practitionerRecord = data?.[0];
	const practitioner = practitionerRecord?.data;
	const currentAvatar = typeof practitioner?.avatar === 'string' ? practitioner.avatar : undefined;
	const currentEmail = (() => {
		if (typeof practitioner?.email === 'string' && practitioner.email.trim()) {
			return practitioner.email;
		}
		if (typeof practitionerRecord?.title === 'string' && practitionerRecord.title.trim()) {
			return practitionerRecord.title;
		}
		return '';
	})();
	const currentDisplayName = typeof practitioner?.display_name === 'string' ? practitioner.display_name : '';
	const currentClinic = typeof practitioner?.clinic === 'string' ? practitioner.clinic : '';
	const currentWebsite = typeof practitioner?.website === 'string' ? practitioner.website : '';
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
	const [email, setEmail] = React.useState(currentEmail);
	const [displayName, setDisplayName] = React.useState(currentDisplayName);
	const [clinic, setClinic] = React.useState(currentClinic);
	const [website, setWebsite] = React.useState(currentWebsite);
	const [accessLevel, setAccessLevel] = React.useState(currentAccessLevel);
	const [avatarChanged, setAvatarChanged] = React.useState(false);
	const [savingDisplayName, setSavingDisplayName] = React.useState(false);
	const [displayNameError, setDisplayNameError] = React.useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [accessMenuAnchorEl, setAccessMenuAnchorEl] = React.useState<null | HTMLElement>(null);
	const hasEmailChanges = email.trim() !== currentEmail;
	const hasDisplayNameChanges = displayName.trim() !== currentDisplayName;
	const hasClinicChanges = clinic.trim() !== currentClinic;
	const hasWebsiteChanges = website.trim() !== currentWebsite;
	const hasAccessLevelChanges = accessLevel !== currentAccessLevel;
	const canSave = hasEmailChanges || hasDisplayNameChanges || hasClinicChanges || hasWebsiteChanges || hasAccessLevelChanges || avatarChanged;
	const isAccessMenuOpen = Boolean(accessMenuAnchorEl);
	const accessLevelLabel = React.useMemo(() => {
		return ACCESS_LEVEL_LABELS[accessLevel] || 'Access Level';
	}, [accessLevel]);

	React.useEffect(() => {
		setEmail(currentEmail);
	}, [currentEmail]);

	React.useEffect(() => {
		setDisplayName(currentDisplayName);
	}, [currentDisplayName]);

	React.useEffect(() => {
		setClinic(currentClinic);
	}, [currentClinic]);

	React.useEffect(() => {
		setWebsite(currentWebsite);
	}, [currentWebsite]);

	React.useEffect(() => {
		setAccessLevel(currentAccessLevel);
	}, [currentAccessLevel]);

	const router = useRouter();
	const [deleting, setDeleting] = React.useState(false);

	const handleDelete = () => {
		setConfirmOpen(true);
	};

	const handleBack = React.useCallback(() => {
		router.back();
	}, [router]);

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

	const handleOpenAccessMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAccessMenuAnchorEl(event.currentTarget);
	};

	const handleCloseAccessMenu = () => {
		setAccessMenuAnchorEl(null);
	};

	const handleSelectAccessLevel = (nextAccessLevel: number) => {
		setAccessLevel(String(nextAccessLevel));
		handleCloseAccessMenu();
	};

	const handleSaveDisplayName = async () => {
		if (!uuid) return;
		if (!canSave) return;

		if (!hasEmailChanges && !hasDisplayNameChanges && !hasClinicChanges && !hasWebsiteChanges && !hasAccessLevelChanges && avatarChanged) {
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
			await dispatch(updatePractitionerProfile({
				practitioner_id: uuid,
				email,
				display_name: displayName,
				clinic,
				website,
				access_level: Number(accessLevel),
			}) as any);

			setAvatarChanged(false);
			dispatch(navigateTo(router, `/practitioners`));
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
		dispatch(navigateTo(router, `/practitioners`));
	};


	React.useEffect(() => {
		if (!route) return;
		dispatch(fetchLeida(route));
	}, [dispatch, route]);

	React.useEffect(() => {
		dispatch(setLeida('header', {
			title: data?.[0]?.data?.display_name || 'Practitioner',
			icon: 'practitioner',
		}));
	}, [dispatch, data]);

	return (
		<Box
			id={`practitioner-update-${uuid}`}
			sx={{ pb: 'calc(104px + env(safe-area-inset-bottom))' }}
		>
			<>
				{!loading && !deleting && (
					<>
						{/* Header with delete button */}
						<Stack
							direction="row"
							sx={{ mb: 1 }}
						>
							<MightyButton
								startIcon="left"
								variant="text"
								disabled={deleting}
								onClick={handleBack}
							>
								Back
							</MightyButton>
							<Box sx={{ flexGrow: 1 }} />
						</Stack>
					</>
				)}
				
				{deleting ? (
					<Stack spacing={1} sx={{ pt: 0.5 }}>
						<LinearProgress />
						<Typography variant="body2" color="text.secondary">
							Deleting Practitioner and related account data...
						</Typography>
					</Stack>
				) : (
					<>
						{loading && (
							<Box sx={{height: 12}}>
								{loading && <LinearProgress />}
							</Box>
						)}
						{error && <Typography variant="body2" color="error">
							Error: {error}
						</Typography>}

						{!loading && !error && (
							<>
								<Grid container spacing={1} alignItems="center">
									
									<Grid size={{
										xs: 12,
										sm: 4,
									}} sx={{ alignSelf: 'flex-start', order: { xs: 1, sm: 2 } }}>
										<Box sx={{ 
											display: 'flex', 
											justifyContent: 'center', 
											alignItems: 'flex-start', 
											height: '100%',
											m:2
										}}>
											<AvatarUpload
												size={125}
												practitionerId={uuid}
												currentAvatar={currentAvatar}
												displayName={currentDisplayName || data?.[0]?.title || 'Practitioner'}
												onSuccess={handleAvatarSuccess}
											/>
										</Box>

												<MightyButton
													kind="listItem"
													color="warning"
													disabled={deleting}
													onClick={handleDelete}
													icon="delete"
												>
													Delete
												</MightyButton>

												<MightyButton
													kind="listItem"
													disabled={deleting || savingDisplayName}
													onClick={handleOpenAccessMenu}
													title={accessLevelLabel}
													icon="admin"
												>
													{accessLevelLabel}
												</MightyButton>
												<Menu
													anchorEl={accessMenuAnchorEl}
													open={isAccessMenuOpen}
													onClose={handleCloseAccessMenu}
												>
													{ACCESS_LEVEL_OPTIONS.map((option) => (
														<MenuItem
															key={option.index}
															selected={String(option.index) === accessLevel}
															onClick={() => handleSelectAccessLevel(option.index)}
														>
															{option.label}
														</MenuItem>
													))}
												</Menu>
									</Grid>

									<Grid size={{
										xs: 12,
										sm: 8,
									}} sx={{ order: { xs: 2, sm: 1 } }}>
											<Box sx={{ height: 24 }} />
											<Editable
												helperText={email}
												placeholder="Name"
												value={displayName}
												variant="standard"
												onChange={setDisplayName}
												startAdornment="user"
											/>
											<Box sx={{ height: 12 }} />
											<Editable
												placeholder="Clinic"
												value={clinic}
												variant="standard"
												onChange={setClinic}
												startAdornment="medical"
											/>
											<Box sx={{ height: 24 }} />
											<Editable
												placeholder="Link"
												value={website}
												variant="standard"
												onChange={setWebsite}
												startAdornment="link"
											/>	
									</Grid>
									
								</Grid>
								<Collapse
									in={canSave || savingDisplayName}
									orientation="vertical"
									unmountOnExit>
									<Box sx={{ height: 24 }} />
									<Button
										fullWidth
										variant="contained"
										startIcon={<Icon icon="save" />}
										color="primary"
										onClick={handleSaveDisplayName}
										disabled={savingDisplayName || !canSave}
										sx={{ pointerEvents: 'auto' }}
									>
										{savingDisplayName ? 'Updating...' : 'Update'}
									</Button>
								</Collapse>
							</>
						)}
					</>
				)}
			</>

			{/* Confirm Delete Dialog */}
			<ConfirmAction
				open={confirmOpen}
				icon="delete"
				title={`Delete ${displayName}?`}
				body={`This action cannot be undone.`}
				handleConfirm={handleConfirmDelete}
				handleClose={handleCloseConfirm}
			/>		
		</Box>
	);
};

export default PractitionerUpdate;
