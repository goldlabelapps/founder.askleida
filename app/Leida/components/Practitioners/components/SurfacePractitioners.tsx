"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Avatar,
    Card,
    CardContent,
    CardHeader,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Typography,
} from '@mui/material';
import { Icon, navigateTo } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import { parsePractitionerData } from '../../../lib/parsePractitionerData';
import type { T_PractitionerRecord } from '../../../types.d';

type SurfacePractitionersProps = {
    practitioners?: T_PractitionerRecord[];
    loading?: boolean;
};

function toTime(value: unknown): number {
    if (typeof value !== 'string') return 0;
    const time = Date.parse(value);
    return Number.isNaN(time) ? 0 : time;
}

function getRecordUpdatedTime(record: T_PractitionerRecord | null): number {
    if (!record) return 0;
    const data = parsePractitionerData(record.data);
    return (
        toTime(record.updated) ||
        toTime((record as Record<string, unknown>).updatedAt) ||
        toTime((record as Record<string, unknown>).updated_at) ||
        toTime((data as Record<string, unknown>).updatedAt) ||
        toTime((data as Record<string, unknown>).updated_at)
    );
}

function getRecordCreatedTime(record: T_PractitionerRecord | null): number {
    if (!record) return 0;
    const data = parsePractitionerData(record.data);
    return (
        toTime(record.created) ||
        toTime((record as Record<string, unknown>).createdAt) ||
        toTime((record as Record<string, unknown>).created_at) ||
        toTime((data as Record<string, unknown>).createdAt) ||
        toTime((data as Record<string, unknown>).created_at)
    );
}

function formatUpdatedLabel(record: T_PractitionerRecord | null): string {
    if (!record) return 'No practitioners yet';
    const timestamp = getRecordUpdatedTime(record) || getRecordCreatedTime(record);
    if (!timestamp) return 'Updated recently';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return 'Updated recently';
    return `Updated ${date.toLocaleDateString()}`;
}

export default function SurfacePractitioners({ practitioners = [], loading = false }: SurfacePractitionersProps) {
    const dispatch = useDispatch();
    const router = useRouter();

    const latestPractitioner = React.useMemo(() => {
        if (!Array.isArray(practitioners) || practitioners.length === 0) return null;
        const sorted = [...practitioners].sort((a, b) => {
            const aUpdated = getRecordUpdatedTime(a);
            const bUpdated = getRecordUpdatedTime(b);
            const aTime = aUpdated || getRecordCreatedTime(a);
            const bTime = bUpdated || getRecordCreatedTime(b);
            return bTime - aTime;
        });
        return sorted[0] || null;
    }, [practitioners]);

    const parsedData = parsePractitionerData(latestPractitioner?.data);
    const practitionerId = typeof latestPractitioner?.practitioner_id === 'string'
        ? latestPractitioner.practitioner_id
        : null;
    const avatar = typeof parsedData.avatar === 'string' ? parsedData.avatar : '';
    const displayName = typeof parsedData.display_name === 'string' && parsedData.display_name.trim()
        ? parsedData.display_name.trim()
        : (typeof latestPractitioner?.title === 'string' && latestPractitioner.title.trim()
            ? latestPractitioner.title.trim()
            : 'Latest practitioner');
    const updatedLabel = formatUpdatedLabel(latestPractitioner);

    const handleOpenPractitioner = () => {
        if (!practitionerId) {
            dispatch(navigateTo(router, '/practitioners'));
            return;
        }
        dispatch(navigateTo(router, `/practitioners/${practitionerId}`));
    };

    return (
        <>
            
            <Card variant="outlined">
                <CardHeader
                    avatar={<Icon icon="practitioner" />}
                    title={`Practitioners (${practitioners.length})`}
                />
                <CardContent sx={{ pt: 0 }}>
                    <Typography variant="overline" sx={{ px: 1 }}>
                        Last Updated
                    </Typography>
                    <ListItemButton onClick={handleOpenPractitioner} disabled={loading && !latestPractitioner}>
                        <ListItemAvatar>
                            <Avatar src={avatar || undefined} alt={displayName}>
                                {displayName.slice(0, 1).toUpperCase()}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={loading && !latestPractitioner ? 'Loading practitioners...' : displayName}
                            
                        />
                    </ListItemButton>
                    {!loading && !latestPractitioner && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Add your first practitioner to get started.
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
