'use client';
import * as React from 'react';
import {
    Avatar,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { setLeidaAdmin, useLeidaAdmin } from '../../../NXAdmin';
import { initPractitioners, usePractitioners } from '../Practitioners';
import { useDash } from '../MegaDash';

type T_Practitioner = {
    practitioner_id?: string;
    title?: string | null;
    data?: {
        avatar?: string;
        display_name?: string;
    };
};

export default function Practitioners() {

    const dispatch = useDispatch();
    const router = useRouter();
    const nxAdmin = useLeidaAdmin();
    const dash = useDash();
    const practitioners = usePractitioners();
    const didInit = React.useRef(false);
    const list = Array.isArray(practitioners?.list) ? practitioners.list as T_Practitioner[] : [];
    const loading = Boolean(practitioners?.loading);
    
    React.useEffect(() => {
        if (!didInit.current) {
            if (!nxAdmin || !nxAdmin.practitioners) dispatch(initPractitioners());
            didInit.current = true;
        }
    }, [dispatch, nxAdmin]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setLeidaAdmin('header', {
                title: 'Practitioners',
                icon: 'visitor',
            }));
        }
    }, [dispatch, dash?.title]);

    const handleClick = React.useCallback((id?: string) => {
        if (!id) return;
        dispatch(navigateTo(router, `/practitioners/${id}`));
    }, [dispatch, router]);


    return (
        <>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography variant="h6">Practitioners</Typography>
                                {loading && (
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <CircularProgress size={18} />
                                        <Typography variant="body2" color="text.secondary">Loading practitioners...</Typography>
                                    </Stack>
                                )}
                            </Stack>

                            {!loading && list.length === 0 && (
                                <Typography sx={{ mt: 2 }} variant="body2" color="text.secondary">
                                    No practitioners found.
                                </Typography>
                            )}

                            <List sx={{ mt: 1, p: 0 }}>
                                {list.map((item) => {
                                    const id = item?.practitioner_id;
                                    const title = item?.title || 'Untitled practitioner';
                                    const displayName = item?.data?.display_name;
                                    const subtitle = displayName || id || '';
                                    const avatarSrc = item?.data?.avatar;

                                    return (
                                        <ListItem key={id || title} disablePadding>
                                            <ListItemButton onClick={() => handleClick(id)}>
                                                <ListItemAvatar>
                                                    <Avatar src={avatarSrc} alt={title} />
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={title}
                                                    secondary={subtitle}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
}