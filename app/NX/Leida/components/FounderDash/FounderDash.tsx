'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    ButtonBase,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { Icon, navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../NXAdmin';
import { 
    initDash, 
    useDash,
} from '../../../Leida';


export default function FounderDash() {
    
    const dispatch = useDispatch();
    const router = useRouter();
    const nxAdmin = useNXAdmin();
    const dash = useDash();
    const didInit = React.useRef(false);

    const dashboardActions = [
        {
            title: 'Products',
            description: 'Browse and manage the product catalog.',
            icon: 'products',
            route: '/products',
        },
        {
            title: 'Practitioners',
            description: 'Manage practitioner profiles.',
            icon: 'practitioner',
            route: '/practitioners',
        },
        
    ] as const;
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!nxAdmin || !nxAdmin.dash) dispatch(initDash());
            didInit.current = true;
        }
    }, [dispatch, nxAdmin]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Dashboard',
                icon: 'dashboard',
            }));
        }
    }, [dispatch, dash?.title]);

    return (
        <Box
            sx={{
                minHeight: '100%',
                display: 'flex',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, minmax(0, 1fr))',
                    },
                    gap: 2,
                    flex: 1,
                    width: '100%',
                    minHeight: '100%',
                }}
            >
                {dashboardActions.map((action) => (
                    <Paper
                        key={action.route}
                        elevation={0}
                        sx={{
                            minHeight: { xs: 180, md: '100%' },
                            height: '100%',
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                        }}
                    >
                        <ButtonBase
                            onClick={() => dispatch(navigateTo(router, action.route))}
                            sx={{
                                width: '100%',
                                height: '100%',
                                minHeight: 'inherit',
                                alignItems: 'stretch',
                                justifyContent: 'stretch',
                                textAlign: 'left',
                                p: 0,
                            }}
                        >
                            <Stack
                                spacing={2}
                                sx={{
                                    flex: 1,
                                    p: { xs: 3, md: 4 },
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 2,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'action.hover',
                                    }}
                                >
                                    <Icon icon={action.icon as any} />
                                </Box>

                                <Stack spacing={1}>
                                    <Typography variant="h4">
                                        {action.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {action.description}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </ButtonBase>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
}

/*

*/