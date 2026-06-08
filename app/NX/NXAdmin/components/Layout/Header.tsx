'use client';
import * as React from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {
    Box,
    Typography,
    CardHeader,
    IconButton,
} from '@mui/material';
import { Icon, navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { useHeader, NXAdminMenu } from '../../../NXAdmin';

export default function Header() {

    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch();
    const header = useHeader();
    const title = header?.title || '';
    const icon = header?.icon || null;

    return (<>
            <CardHeader
                sx={{ width: '100%' }}
                avatar={<>{icon ? 
                        <Icon icon={icon as any} />
                        : null}</>}
                title={<Typography variant="h4" color="text.secondary">
                    {title}
                </Typography>}
                subheader={header?.subheader || null}
                action={ <Box sx={{}}>
                            <NXAdminMenu />
                        </Box>}
            />
        </>
    );
}