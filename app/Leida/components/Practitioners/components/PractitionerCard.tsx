'use client';
import * as React from 'react';
import {useRouter} from 'next/navigation';
import {
	Avatar,
	ButtonBase,
	Paper,
	Box,
	Typography,
	Chip,
} from '@mui/material';
import { navigateTo, Icon } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import { parsePractitionerData } from '../../../lib/parsePractitionerData';
import type { T_PractitionerRecord } from '../../../types.d';

const PractitionerCard = ({
	practitioner,
}: {
	practitioner: T_PractitionerRecord;
}) => {
	const dispatch = useDispatch();
	const router = useRouter();
	const parsedData = parsePractitionerData(practitioner?.data);
	const email = (() => {
		if (typeof parsedData?.email === 'string' && parsedData.email.trim()) {
			return parsedData.email.trim();
		}
		if (typeof practitioner?.title === 'string') {
			return practitioner.title;
		}
		return '';
	})();
	const displayName = typeof parsedData?.display_name === 'string' && parsedData.display_name.trim()
		? parsedData.display_name.trim()
		: (email || 'Unknown practitioner');
	const clinic = typeof parsedData?.clinic === 'string' ? parsedData.clinic.trim() : '';
	const secondaryText = clinic || email;
	const website = typeof parsedData?.website === 'string' ? parsedData.website.trim() : '';
	const avatar = typeof parsedData?.avatar === 'string' ? parsedData.avatar : '';
	const accessLevel = (() => {
		const value = parsedData?.access_level;
		if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5) {
			return value;
		}
		if (typeof value === 'string' && /^[0-5]$/.test(value.trim())) {
			return Number(value.trim());
		}
		return null;
	})();
	const accessLevelLabel = (() => {
		
		switch (accessLevel) {
			case 4:
				return 'Founder';
			case 3:
				return 'QA';
			case 2:
				return 'Practitioner';
			case 1:
				return 'Client';
			default:
				return null;
		}
	})();
	const practitionerId = typeof practitioner?.practitioner_id === 'string' ? practitioner.practitioner_id : 'N/A';
	const canEdit = practitionerId !== 'N/A';

	const onboardingStatus = (() => {
		const onboarding = parsedData?.onboarding;
		if (onboarding && typeof onboarding === 'object') {
			return (onboarding as Record<string, unknown>).status;
		}
		return null;
	})();

	// isOnboard = practitioner has set their password (past the 'invited' stage)
	const isOnboard = onboardingStatus && onboardingStatus !== 'invited';
	
	// isOnboardingComplete = practitioner has fully completed onboarding
	const isOnboardingComplete = onboardingStatus === 'completed' || onboardingStatus === 'onboarded';
	
	const statusIcon = isOnboardingComplete ? 'tick' : isOnboard ? 'info' : 'warning';
	const statusColor = isOnboardingComplete ? 'success' : isOnboard ? 'info' : 'warning';

	const handleEdit = () => {
		if (!canEdit) return;
		dispatch(navigateTo(router, `/practitioners/${practitionerId}`));
	};

	return (
		<ButtonBase
			onClick={handleEdit}
			disabled={!canEdit}
			sx={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: 1 }}
		>
			<Paper variant="outlined" sx={{ p: 1.5, width: '100%' }}>
				
				<Box sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}>
					<Box sx={{ display: 'flex', flex: 1 }}>
						<Box>
							<Avatar
								src={avatar}
								alt={displayName}
								sx={{ alignSelf: 'flex-start', backgroundColor: 'common.white', mr: 1 }}
							/>
						</Box>
						<Box sx={{m: 0.5}}>
							<Typography variant="h6">
								{displayName}
							</Typography>
							
						</Box>
					</Box>
					{/* <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
						<Icon 
							icon={statusIcon} 
							color="primary"
						/>
					</Box> */}
				</Box>
			</Paper>
		</ButtonBase>
	);
};

export default PractitionerCard;


