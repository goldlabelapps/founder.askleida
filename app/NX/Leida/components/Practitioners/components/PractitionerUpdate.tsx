'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
	Paper, 
	Stack,
	LinearProgress,
	Typography,
	Button,
	IconButton,
} from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { Icon, ConfirmAction } from '../../../../DesignSystem';
import { 
	fetchLeida,
	useLeidaBus,
	deletePractitioner,
} from '../../../../Leida';
import { setNXAdmin, Editable } from '../../../../NXAdmin';

const PractitionerUpdate = () => {

	const dispatch = useDispatch();
	const pathname = usePathname();
	const uuid = pathname?.split('/').pop() ?? '';
	const route = uuid ? `practitioners/${uuid}` : '';
	const { loading, error, data } = useLeidaBus(route);
	const practitioner = data?.[0]?.data;
	const currentDisplayName = typeof practitioner?.display_name === 'string' ? practitioner.display_name : '';
	const [displayName, setDisplayName] = React.useState(currentDisplayName);
	const [savingDisplayName, setSavingDisplayName] = React.useState(false);
	const [displayNameError, setDisplayNameError] = React.useState<string | null>(null);
	const [confirmOpen, setConfirmOpen] = React.useState(false);

	React.useEffect(() => {
		setDisplayName(currentDisplayName);
	}, [currentDisplayName]);

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

		setDisplayNameError(null);
		setSavingDisplayName(true);

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
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			setDisplayNameError(msg);
		} finally {
			setSavingDisplayName(false);
		}
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
								<Editable
									label="Name"
									value={displayName}
									variant="standard"
									onChange={setDisplayName}
								/>
								<Button
									variant="contained"
									startIcon={<Icon icon="save" />}
									color="primary"
									sx={{my: 2}}
									onClick={handleSaveDisplayName}
									disabled={savingDisplayName || displayName.trim() === currentDisplayName}
								>
									{savingDisplayName ? 'Saving...' : 'Save'}
								</Button>
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
