"use client";
import React from 'react';
import { IconButton } from '@mui/material';
import { Icon } from '../../DesignSystem';
import { 
    usePaywall, 
} from '../../Paywall';

export interface I_UserSpot {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function UserSpot({ onClick }: I_UserSpot) {
    
    const paywall = usePaywall();
    const uid = paywall ? paywall.uid : null;

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
            <Icon icon="settings" />
        </IconButton>
    );
}
