'use client';
import * as React from 'react';
import {
    Alert,
    AppBar,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Toolbar,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Icon, navigateTo } from '../../../DesignSystem';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import {
    useDash,
} from '../../../Leida';
import { initSupabase } from './actions/initSupabase';
import { fetchSupabaseAuthUsers } from './actions/fetchSupabaseAuthUsers';
import { useSupabase } from './hooks/useSupabase';
import type { T_SupabaseAuthUser } from './types';

type T_PractitionerRecord = {
    practitioner_id?: string;
    name?: string;
    title?: string;
    updated?: string;
    created?: string;
    [key: string]: any;
};


export default function Supabase() {

    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();
    const supabase = useSupabase();

    const currentPage = typeof supabase?.authPage === 'number' && supabase.authPage > 0 ? supabase.authPage : 1;
    const perPage = typeof supabase?.authPerPage === 'number' && supabase.authPerPage > 0 ? supabase.authPerPage : 10;
    const total = typeof supabase?.authTotal === 'number' && supabase.authTotal > 0 ? supabase.authTotal : 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;
    const authUsers = (Array.isArray(supabase?.authUsers) ? supabase.authUsers : []) as T_SupabaseAuthUser[];
    const [practitioners, setPractitioners] = React.useState<T_PractitionerRecord[]>([]);
    const [practitionersLoading, setPractitionersLoading] = React.useState(false);
    const [practitionersError, setPractitionersError] = React.useState<string | null>(null);

    const authUuidSet = React.useMemo(() => {
        const uuids = authUsers
            .map((user) => (typeof user?.id === 'string' ? user.id : null))
            .filter((value): value is string => Boolean(value));
        return new Set(uuids);
    }, [authUsers]);

    const matchedPractitioners = React.useMemo(() => {
        return practitioners.filter((record) => {
            const practitionerId = typeof record?.practitioner_id === 'string' ? record.practitioner_id : '';
            return practitionerId ? authUuidSet.has(practitionerId) : false;
        }).length;
    }, [authUuidSet, practitioners]);

    const unmatchedPractitioners = practitioners.length - matchedPractitioners;

    const loadPractitioners = React.useCallback(async () => {
        setPractitionersLoading(true);
        setPractitionersError(null);

        try {
            const res = await fetch('/api/practitioners', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            const json = await res.json().catch(() => null);
            if (!res.ok) {
                const message = typeof json?.message === 'string'
                    ? json.message
                    : `Failed to fetch practitioners (${res.status})`;
                throw new Error(message);
            }

            const data = Array.isArray(json?.data) ? json.data : [];
            setPractitioners(data as T_PractitionerRecord[]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setPractitionersError(msg || 'Failed to fetch practitioners');
        } finally {
            setPractitionersLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (!supabase?.initted) {
            dispatch(initSupabase());
        }
    }, [dispatch, supabase?.initted]);

    React.useEffect(() => {
        loadPractitioners();
    }, [loadPractitioners]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Supabase',
                icon: 'supabase',
            }));
        }
    }, [dispatch, dash?.title]);

    const handleGoToPostgres = React.useCallback(() => {
        dispatch(navigateTo(router, '/supabase/postgres'));
    }, [dispatch, router]);

    const handleGoToPractitioners = React.useCallback(() => {
        dispatch(navigateTo(router, '/practitioners'));
    }, [dispatch, router]);

    const handleRefresh = React.useCallback(() => {
        dispatch(fetchSupabaseAuthUsers({ page: currentPage, perPage }));
        loadPractitioners();
    }, [currentPage, dispatch, loadPractitioners, perPage]);

    const handlePageChange = React.useCallback((page: number) => {
        dispatch(fetchSupabaseAuthUsers({ page, perPage }));
    }, [dispatch, perPage]);

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <AppBar
                    position="static"
                    color="transparent"
                    elevation={0}
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
                    }}
                >
                    <Toolbar sx={{ minHeight: '56px !important', px: 1.5, justifyContent: 'flex-end' }}>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                endIcon={<Icon icon="new" />}
                                onClick={handleGoToPractitioners}
                            >
                                New Practitioner
                            </Button>
                            <Button
                                variant="outlined"
                                endIcon={<Icon icon="right" />}
                                onClick={handleGoToPostgres}
                            >
                                Postgres tools
                            </Button>
                        </Stack>
                    </Toolbar>
                </AppBar>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="h6">Supabase users</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Authenticated users list from Supabase Auth.
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                            <Chip size="small" label={`${total} users`} />
                            <Chip size="small" variant="outlined" label={`Page ${currentPage} of ${totalPages}`} />
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={Boolean(supabase?.authLoading) || !canGoPrevious}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={Boolean(supabase?.authLoading) || !canGoNext}
                            >
                                Next
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleRefresh}
                                disabled={Boolean(supabase?.authLoading)}
                            >
                                Refresh
                            </Button>
                        </Stack>

                        {supabase?.authError && <Alert severity="error">{supabase.authError}</Alert>}

                        <Box sx={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Email</TableCell>
                                        <TableCell>UUID</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {authUsers.map((user) => (
                                        <TableRow key={user.id || user.email} hover>
                                            <TableCell>{user.email || user.id || 'Unknown'}</TableCell>
                                            <TableCell>{user.id || 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                    </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                        <Typography variant="h6">Practitioner records</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Key rule: practitioner_id must equal Supabase Auth uid.
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                            <Chip size="small" label={`${practitioners.length} practitioners`} />
                            <Chip size="small" variant="outlined" color="success" label={`${matchedPractitioners} matched`} />
                            <Chip size="small" variant="outlined" color={unmatchedPractitioners > 0 ? 'warning' : 'default'} label={`${unmatchedPractitioners} unmatched`} />
                        </Stack>

                        {practitionersError && <Alert severity="error">{practitionersError}</Alert>}

                        <Box sx={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Practitioner ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Auth link</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {practitioners.map((record, index) => {
                                        const practitionerId = typeof record?.practitioner_id === 'string' ? record.practitioner_id : '';
                                        const isLinked = practitionerId ? authUuidSet.has(practitionerId) : false;
                                        const name = typeof record?.name === 'string'
                                            ? record.name
                                            : (typeof record?.title === 'string' ? record.title : 'N/A');

                                        return (
                                            <TableRow key={practitionerId || `practitioner-${index}`} hover>
                                                <TableCell>{practitionerId || 'N/A'}</TableCell>
                                                <TableCell>{name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={isLinked ? 'matched uid' : 'missing auth user'}
                                                        color={isLinked ? 'success' : 'warning'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>

                        {practitionersLoading && (
                            <Typography variant="caption" color="text.secondary">
                                Loading practitioners...
                            </Typography>
                        )}
                    </Stack>
                </Paper>
            </Stack>
        </Box>
    );
}
