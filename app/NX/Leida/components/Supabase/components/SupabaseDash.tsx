'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { Icon, navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { initSupabase } from '../actions/initSupabase';
import { useSupabase } from '../hooks/useSupabase';
import type { T_SupabaseTable } from '../types';

export default function SupabaseDash() {

    const dispatch = useDispatch();
    const supabase = useSupabase();
    const router = useRouter();
    const tables = (Array.isArray(supabase?.schema?.tables) ? supabase.schema.tables : []) as T_SupabaseTable[];
    const didRequest = React.useRef(false);

    const stats = React.useMemo(() => ({
        tableCount: tables.length,
        columnCount: tables.reduce((acc, t) => acc + (Array.isArray(t.columns) ? t.columns.length : 0), 0),
        constraintCount: tables.reduce((acc, t) => acc + (Array.isArray(t.constraints) ? t.constraints.length : 0), 0),
        knownRows: tables.reduce((acc, t) => acc + (typeof t.estimated_rows === 'number' && t.estimated_rows >= 0 ? t.estimated_rows : 0), 0),
    }), [tables]);

    React.useEffect(() => {
        if (!didRequest.current && !supabase?.initted) {
            dispatch(initSupabase());
            didRequest.current = true;
        }
    }, [dispatch, supabase?.initted]);

    const handleNavigate = () => {
        dispatch(navigateTo(router, '/supabase/postgres'));
    };

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={1.5}>

                <Button
                    variant="outlined"
                    startIcon={<Icon icon="supabase" />}
                    onClick={handleNavigate}
                    sx={{ alignSelf: 'flex-start' }}
                >
                    View {`${stats.tableCount} tables`}
                </Button>
                {supabase?.schemaLoading && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <CircularProgress size={18} />
                            <Typography variant="body2">Loading Supabase schema...</Typography>
                        </Stack>
                    </Paper>
                )}
                {supabase?.schemaError && (
                    <Alert severity="error">{supabase.schemaError}</Alert>
                )}
                {!supabase?.schemaLoading && !supabase?.schemaError && tables.length === 0 && (
                    <Alert severity="info">No schema data found.</Alert>
                )}
            </Stack>
        </Box>
    );
}
