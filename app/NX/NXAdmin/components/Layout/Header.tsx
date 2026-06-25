'use client';
import * as React from 'react';
import pJSON from '../../../../../package.json';
import {usePathname, useRouter} from 'next/navigation';
import {
    Box,
    Typography,
    CardHeader,
    IconButton,
} from '@mui/material';
import { Icon, navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { useHeader } from '../../../NXAdmin';

export default function Header() {

    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch();
    const header = useHeader();
    const title = header?.title || '';
    const icon = header?.icon || null;
    const showBack = false;

    const handleBack = () => {
        dispatch(navigateTo(router, '/'));
    };

    return (<>
            <CardHeader
                sx={{ width: '100%' }}
                avatar={<>
                {showBack ? <IconButton 
                color="primary"
                onClick={handleBack}>
                    <Icon icon="leida" />
                    </IconButton> : null }
                {icon ? <Box sx={{mt: 1 }}>
                            <Icon icon={icon as any} color="primary"/>
                        </Box>
                        : null}</>}
                title={<Typography variant="h5" color="text.secondary">
                    {title}
                </Typography>}
                subheader={header?.subheader || null}
                // action={
                //     <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                //         v{pJSON.version}
                //     </Typography>
                // }
            />
        </>
    );
}