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
import { Icon, navigateTo } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../NX/NXAdmin';
import { 
    initDash, 
    useDash,
    usePractitioners,
} from '../../../Leida';


export default function FounderDash() {
    
    const dispatch = useDispatch();
    const router = useRouter();
    const nxAdmin = useNXAdmin();
    const dash = useDash();
    const practitioners = usePractitioners();
    console.log('practitioners', practitioners);
    const didInit = React.useRef(false);

    const numberOfPractitioners = Array.isArray(practitioners?.list) ? practitioners.list.length : 0;

    const dashboardActions = [    
        {
            title: 'Practitioners',
            // description: `Total ${numberOfPractitioners}`,
            icon: 'practitioner',
            route: '/practitioners',
        },    
        {
            title: 'Products',
            description: 'Browse and manage the products and add more from Awin',
            icon: 'products',
            route: '/products',
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
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Icon icon={action.icon as any} color="primary" />
                                        <Typography variant="h4">
                                            {action.title}
                                        </Typography>
                                    </Stack>
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