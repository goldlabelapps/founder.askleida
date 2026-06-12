"use client";
import React from 'react';
import { Avatar, IconButton } from '@mui/material';
import { 
    usePaywall, 
} from '../../../../Paywall';
import {
    fetchLeida,
    useLeidaBus,
} from '../../../../Leida';
import { useDispatch } from '../../../../Uberedux';

export interface I_UserSpot {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function DashAuth({ onClick }: I_UserSpot) {
    const dispatch = useDispatch();
    const paywall = usePaywall();
    const uid = paywall ? paywall.uid : null;
    const route = uid ? `practitioners/${uid}` : '';
    const { data } = useLeidaBus(route);

    React.useEffect(() => {
        if (!route) return;
        dispatch(fetchLeida(route));
    }, [dispatch, route]);

    const practitionerRecord = Array.isArray(data) && data.length > 0 ? data[0] : null;
    const practitionerData = practitionerRecord?.data && typeof practitionerRecord.data === 'object'
        ? practitionerRecord.data as Record<string, unknown>
        : {};
    const avatarUrl = typeof practitionerData.avatar === 'string' ? practitionerData.avatar : '';
    const displayName = typeof practitionerData.display_name === 'string' && practitionerData.display_name.trim()
        ? practitionerData.display_name.trim()
        : (typeof practitionerRecord?.title === 'string' ? practitionerRecord.title : 'User');
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
