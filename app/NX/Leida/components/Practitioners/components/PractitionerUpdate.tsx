'use client';
import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
	Paper, 
	Stack,
	LinearProgress,
	Typography,
	IconButton,
} from '@mui/material';
import { useDispatch } from '../../../../Uberedux';
import { Icon, ConfirmAction } from '../../../../DesignSystem';
import { 
	fetchLeida,
	useLeidaBus,
	deletePractitioner,
} from '../../../../Leida';
import { setNXAdmin } from '../../../../NXAdmin';

const PractitionerUpdate = () => {

	const dispatch = useDispatch();
	const pathname = usePathname();
	const uuid = pathname?.split('/').pop() ?? '';
	const route = uuid ? `practitioners/${uuid}` : '';
	const { loading, error, data } = useLeidaBus(route);
	const [confirmOpen, setConfirmOpen] = React.useState(false);

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


	React.useEffect(() => {
		if (!route) return;
		dispatch(fetchLeida(route));
	}, [dispatch, route]);

	React.useEffect(() => {
		dispatch(setNXAdmin('header', {
			title: data?.[0]?.title || 'Practitioner',
			icon: 'practitioner',
		}));
	}, [dispatch, data]);

	return (
		<Paper variant="outlined" sx={{ p: 1.5 }}>
			<Stack spacing={1}>
				{/* Header with delete button */}
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{ mb: 1 }}
				>
					<h3 style={{ margin: 0 }}>{data?.[0]?.title || 'Practitioner Details'}</h3>
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
					<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
						{loading && 'Loading...'}
						{error && `Error: ${error}`}
						{!loading && !error && JSON.stringify(data, null, 2)}
					</pre>
				)}
			</Stack>

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
