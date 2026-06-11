'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    Grid,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin, useNXAdmin } from '../../../NXAdmin';
import { 
    initDash, 
    useDash,
    DashSurface,
} from '../../../Leida';


export default function FounderDash() {
    
    const dispatch = useDispatch();
    const nxAdmin = useNXAdmin();
    const dash = useDash();
    const didInit = React.useRef(false);
    
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
                icon: 'leida',
            }));
        }
    }, [dispatch, dash?.title]);

    return (
        <>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            Practitioners. new & list
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <DashSurface />
                        </Grid>

                    </Grid>
                </Grid>
            </Grid>
        </>
    );
}

/*
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>


                <Typography variant="body1" sx={{ flexShrink: 0 }}>
                    Create a Supabase Auth invite. User receives an email to set password and activate their account.
                </Typography>
                <Box sx={{
                    my: 2
                }}>
                    {createError && <Alert severity="error">{createError}</Alert>}
                    {createSuccess && <Alert severity="success">{createSuccess}</Alert>}
                </Box>

                <TextField
                    size="small"
                    label="Email"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    disabled={createLoading}
                />
                <Button
                    variant="outlined"
                    endIcon={<Icon icon="new" />}
                    onClick={handleCreatePractitioner}
                    disabled={createLoading}
                    size="large"
                >
                    {createLoading ? 'Creating...' : 'Create Practitioner'}
                </Button>
            </Paper>
*/