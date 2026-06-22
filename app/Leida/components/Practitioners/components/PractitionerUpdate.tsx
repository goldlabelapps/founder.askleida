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
	useLeidaBus,
	deletePractitioner,
	
} from '../../../../Leida';
import { 
	setNXAdmin, 
	Editable, 
	AvatarUpload,
} from '../../../../NX/NXAdmin';

const ACCESS_LEVEL_OPTIONS = [
	{ index: 4, label: 'Founder' },
	{ index: 3, label: 'QA' },
	{ index: 2, label: 'Practitioner' },
	{ index: 1, label: 'Client' }
];

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
		const match = ACCESS_LEVEL_OPTIONS.find((option) => String(option.index) === accessLevel);
		return match?.label || 'Access Level';
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

	const handleDelete = () => {
		setConfirmOpen(true);
	};

	const handleBack = () => {
		dispatch(navigateTo(router, '/practitioners'));
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
			const trimmedDisplayName = displayName.trim();
			const trimmedEmail = email.trim();
			const trimmedClinic = clinic.trim();
			const trimmedWebsite = website.trim();
			const res = await fetch('/api/practitioners', {
				method: 'PATCH',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					practitioner_id: uuid,
					title: trimmedEmail || trimmedDisplayName || null,
					data: {
						email: trimmedEmail || null,
						display_name: trimmedDisplayName || null,
						name: trimmedDisplayName || null,
						clinic: trimmedClinic || null,
						website: trimmedWebsite || null,
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
		dispatch(setNXAdmin('header', {
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
							// justifyContent="space-between"
							// alignItems="center"
							sx={{ mb: 1 }}
						>
							<IconButton
								color="primary"
								disabled={deleting}
								onClick={handleBack}
							>
								<Icon icon="left" />
							</IconButton>
							
							{email ? (
								<Typography variant="caption" sx={{m:1}}>
									{email}
								</Typography>
							) : null}
							<Box sx={{ flexGrow: 1 }} />
							<IconButton 
								color="primary"
								disabled={deleting || savingDisplayName}
								onClick={handleOpenAccessMenu}
								title={accessLevelLabel}
							>
								<Icon icon="admin" />
							</IconButton>
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
							<IconButton 
								color="primary"
								disabled={deleting}
								onClick={handleDelete}
							>
								<Icon icon="delete" />
							</IconButton>
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
							<Grid container spacing={2} alignItems="center">
								
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
								</Grid>

								<Grid size={{
									xs: 12,
									sm: 8,
								}} sx={{ order: { xs: 2, sm: 1 } }}>
									<Stack spacing={2} sx={{m:2}}>
										<Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
											Access level: {accessLevelLabel}
										</Typography>
										<Editable
											placeholder="Name"
											value={displayName}
											variant="outlined"
											onChange={setDisplayName}
											startAdornment="user"
										/>
										<Editable
											placeholder="Clinic"
											value={clinic}
											variant="outlined"
											onChange={setClinic}
											startAdornment="medical"
										/>
									<Editable
										placeholder="Website"
										value={website}
										variant="outlined"
										onChange={setWebsite}
										startAdornment="link"
									/>
									</Stack>
								</Grid>
							</Grid>
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

			<Box
				sx={{
					position: 'fixed',
					left: 0,
					right: 0,
					bottom: 0,
					zIndex: (theme) => theme.zIndex.appBar + 123,
					// borderTop: 1,
					// borderColor: 'divider',
					// backgroundColor: 'background.paper',
					px: 2,
					py: 1.5,
					pb: 'calc(12px + env(safe-area-inset-bottom))',
					pointerEvents: 'none',
				}}
			>
				
					<Collapse 
						in={canSave || savingDisplayName} 
						orientation="vertical" 
						unmountOnExit>
						<Button
							fullWidth
							variant="contained"
							startIcon={<Icon icon="save" />}
							color="primary"
							onClick={handleSaveDisplayName}
							disabled={savingDisplayName || !canSave}
							sx={{ pointerEvents: 'auto' }}
						>
							{savingDisplayName ? 'Saving...' : 'Save'}
						</Button>
					</Collapse>
			</Box>

			{/* <pre>{JSON.stringify({ email, displayName, clinic, accessLevel }, null, 2)}</pre> */}
		
		</Box>
	);
};

export default PractitionerUpdate;
