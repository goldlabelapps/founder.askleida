"use client";
import React from 'react';
import { Avatar, IconButton } from '@mui/material';
import { 
    usePaywall, 
} from '../../../../NX/Paywall';
import {
    fetchLeida,
    useLeidaBus,
} from '../../../../Leida';
import { useDispatch } from '../../../../NX/Uberedux';
import type { I_UserSpot } from '../../../types.d';

export default function DashAuth({ onClick }: I_UserSpot) {
    const dispatch = useDispatch();
    const paywall = usePaywall();
    const uid = paywall ? paywall.uid : null;
    const user = paywall?.user || null;
    const { data } = useLeidaBus('practitioners');

    React.useEffect(() => {
        if (!uid) return;
        dispatch(fetchLeida('practitioners'));
    }, [dispatch, uid]);

    const practitionerRecord = React.useMemo(() => {
        if (!uid || !Array.isArray(data)) return null;
        return data.find((item: any) => item?.practitioner_id === uid) || null;
    }, [data, uid]);
    const practitionerData = practitionerRecord?.data && typeof practitionerRecord.data === 'object'
        ? practitionerRecord.data as Record<string, unknown>
        : {};
    const avatarUrl = typeof practitionerData.avatar === 'string'
        ? practitionerData.avatar
        : (typeof user?.photoURL === 'string' ? user.photoURL : '');
    const displayName = typeof practitionerData.display_name === 'string' && practitionerData.display_name.trim()
        ? practitionerData.display_name.trim()
        : (typeof user?.displayName === 'string' && user.displayName.trim()
            ? user.displayName.trim()
            : (typeof user?.email === 'string' && user.email.trim() ? user.email.trim() : 'User'));
    const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part.charAt(0).toUpperCase())
        .join('');

    if (!uid) return null;

    return (
        <IconButton onClick={onClick} color="primary" >
            <Avatar
                src={avatarUrl || undefined}
                alt={displayName}
            >
                {initials || 'L'}
            </Avatar>
        </IconButton>
    );
}
