'use client';
import * as React from 'react';
import {useRouter} from 'next/navigation';
import {
	Avatar,
	ButtonBase,
	LinearProgress,
	Paper,
	Box,
	Typography,
	Chip,
} from '@mui/material';
import { navigateTo, Icon } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';

type T_PractitionerData = {
	avatar?: string;
	display_name?: string;
	[key: string]: any;
};

export type T_PractitionerRecord = {
	practitioner_id?: string;
	title?: string;
	created?: string;
	updated?: string;
	data?: unknown;
	[key: string]: any;
};

function parsePractitionerData(value: unknown): T_PractitionerData {
	if (!value) return {};
	if (typeof value === 'object') {
		return value as T_PractitionerData;
	}
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			if (parsed && typeof parsed === 'object') {
				return parsed as T_PractitionerData;
			}
		} catch {
			return {};
		}
	}
	return {};
}

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
	const clinic = typeof parsedData?.clinic === 'string' ? parsedData.clinic : '';
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

	const isOnboardingComplete = onboardingStatus === 'completed' || onboardingStatus === 'onboarded';
	const statusIcon = isOnboardingComplete ? 'tick' : 'warning';
	const statusColor = isOnboardingComplete ? 'success' : 'warning';

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
						<Box sx={{mx: 1}}>
							<Typography variant="body1">
								{displayName}
							</Typography>
							<Typography variant="body2" color="textSecondary">
								{email}
							</Typography>
						</Box>
					</Box>
					<Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
						<Icon 
							icon={statusIcon} 
							sx={{ 
								color: statusColor === 'success' ? 'success.main' : 'warning.main',
								fontSize: '1.25rem'
							}} 
						/>
					</Box>
				</Box>
				
			</Paper>
		</ButtonBase>
	);
};

export default PractitionerCard;
