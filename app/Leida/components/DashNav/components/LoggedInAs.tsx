'use client';

import * as React from 'react';
import { CardHeader, IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
 } from '@mui/material';
import { ConfirmAction, Icon } from '../../../../NX/DesignSystem';
import { logout, usePaywall } from '../../../../NX/Paywall';
import { useDispatch } from '../../../../NX/Uberedux';

export default function LoggedInAs({
    onNavigate,
}: {
    onNavigate?: () => void;
}) {
    const dispatch = useDispatch();
    const paywall = usePaywall();
    const [confirmSignOutOpen, setConfirmSignOutOpen] = React.useState(false);

    const email = typeof paywall?.user?.email === 'string' && paywall.user.email.trim()
        ? paywall.user.email.trim()
        : 'Unknown user';

    const handleOpenSignOutConfirm = React.useCallback(() => {
        setConfirmSignOutOpen(true);
    }, []);

    const handleCloseSignOutConfirm = React.useCallback(() => {
        setConfirmSignOutOpen(false);
    }, []);

    const handleSignOut = React.useCallback(() => {
        setConfirmSignOutOpen(false);
        dispatch(logout());
        onNavigate?.();
    }, [dispatch, onNavigate]);

    return (
        <>

            <ListItemButton
                onClick={handleOpenSignOutConfirm} 
                aria-label="Sign out"
            >
                <ListItemIcon>
                    <Icon icon={'signout'} color={'primary'} />
                </ListItemIcon>
                <ListItemText
                    primary={<Typography variant="body2">{email}</Typography>}
                />
            </ListItemButton>


            <ConfirmAction
                open={confirmSignOutOpen}
                icon="signout"
                title="Sign out?"
                handleConfirm={handleSignOut}
                handleClose={handleCloseSignOutConfirm}
            />
        </>
    );
}