'use client';
import * as React from 'react';
import {useRouter} from 'next/navigation';
import {
	Avatar,
	ButtonBase,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';

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
	const email = typeof practitioner?.title === 'string' ? practitioner.title : '';
	const displayName = typeof parsedData?.display_name === 'string' && parsedData.display_name.trim()
		? parsedData.display_name.trim()
		: (email || 'Unknown practitioner');
	const avatar = typeof parsedData?.avatar === 'string' ? parsedData.avatar : '';
	const practitionerId = typeof practitioner?.practitioner_id === 'string' ? practitioner.practitioner_id : 'N/A';
	const canEdit = practitionerId !== 'N/A';

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
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Avatar src={avatar || 'https://app.askleida.com/shared/svg/guest.svg'} alt={displayName} />
					<Stack spacing={0.25}>
						<Typography variant="subtitle2">{displayName}</Typography>
						<Typography variant="body2" color="text.secondary">{email || 'No email'}</Typography>
					</Stack>
				</Stack>
			</Paper>
		</ButtonBase>
	);
};

export default PractitionerCard;
