'use client';
import * as React from 'react';
import {
    Grid,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../NXAdmin';
import { usePaywall } from '../../../Paywall';
import { initAccount, setAccount, useAccount } from '../Account';
import { useDash } from '../MegaDash';
export default function Account() {
    
    const dispatch = useDispatch();
    const nxAdmin = useNXAdmin();
    const dash = useDash();
    const paywall = usePaywall();
    const account = useAccount();
    const user = paywall?.user ?? null;
    const didInit = React.useRef(false);
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!nxAdmin || !nxAdmin.account) dispatch(initAccount());
            didInit.current = true;
        }
    }, [dispatch, nxAdmin]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Account°',
                icon: 'account',
            }));
        }
    }, [dispatch, dash?.title]);

    React.useEffect(() => {
        if (!account || account.user !== user) {
            dispatch(setAccount('user', user));
        }
    }, [dispatch, account, user]);

    return (
        <>
            <pre>{JSON.stringify(account, null, 2)}</pre>
        </>
    );
}
