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

    // Not used right now: disabling these prevents 404s against missing
    // Supabase `accounts` and `avatars` tables.
    // React.useEffect(() => {
    //     if (!uid) {
    //         attemptedAccountUIDRef.current = null;
    //         return;
    //     }
    //
    //     if (account) {
    //         attemptedAccountUIDRef.current = uid;
    //         return;
    //     }
    //
    //     if (accountSubscribing) return;
    //
    //     if (attemptedAccountUIDRef.current === uid) return;
    //
    //     attemptedAccountUIDRef.current = uid;
    //
    //     if (uid && !account && !accountSubscribing) {
    //         dispatch(setPaywall('accountSubscribing', true));
    //         dispatch(subscribeAccount());
    //     }
    // }, [uid, account, accountSubscribing, dispatch]);
    //
    // React.useEffect(() => {
    //     if (uid && !avatarsFetching) {
    //         dispatch(setPaywall('avatarsFetching', true));
    //         dispatch(avatarsByUID());
    //     }
    // }, [uid, avatarsFetching, dispatch]);

    if (!uid) return null;

    return (
        <IconButton onClick={onClick} color="primary" >
            <Avatar
                src={avatarUrl || undefined}
                alt={displayName}
                sx={{ width: 32, height: 32 }}
            >
                {initials || 'U'}
            </Avatar>
        </IconButton>
    );
}
