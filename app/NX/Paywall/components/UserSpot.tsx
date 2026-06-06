"use client";
import React from 'react';
import { Box, Badge, IconButton, Avatar } from '@mui/material';
import { Icon } from '../../DesignSystem';
import { 
    avatarsByUID,
    usePaywall, 
    subscribeAccount, 
    setPaywall,
} from '../../Paywall';
import { useDispatch } from '../../Uberedux';

export interface I_UserSpot {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export default function UserSpot({ onClick }: I_UserSpot) {
    
    const paywall = usePaywall();
    const account = paywall ? paywall.account : null;
    const accountSubscribing = paywall ? paywall.accountSubscribing : null;
    const avatarsFetching = paywall ? paywall.avatarsFetching : null;
    const uid = paywall ? paywall.uid : null;
    const dispatch = useDispatch();
    const attemptedAccountUIDRef = React.useRef<string | null>(null);

    const [show, setShow] = React.useState(true);

    React.useEffect(() => {
        if (!uid) {
            attemptedAccountUIDRef.current = null;
            return;
        }

        if (account) {
            attemptedAccountUIDRef.current = uid;
            return;
        }

        if (accountSubscribing) return;

        // Avoid infinite retry loops when the backend returns a persistent error
        // (for example: missing `accounts` table in Supabase).
        if (attemptedAccountUIDRef.current === uid) return;

        attemptedAccountUIDRef.current = uid;

        if (uid && !account && !accountSubscribing) {
            dispatch(setPaywall('accountSubscribing', true));
            dispatch(subscribeAccount());
        }
    }, [uid, account, accountSubscribing, dispatch]);

    React.useEffect(() => {
        if (uid && !avatarsFetching) {
            dispatch(setPaywall('avatarsFetching', true));
            dispatch(avatarsByUID());
        }
    }, [uid, avatarsFetching, dispatch]);

    if (!show) return null;
    if (!account) return null;

    return (
        <IconButton onClick={onClick} color="primary" >
            <Icon icon="menu" />
            {/* {account ? (
                <Avatar  alt={account.name} src={account.avatar} />
            ) : (
                <Icon icon="async" />
            )} */}
        </IconButton>
    );
}
