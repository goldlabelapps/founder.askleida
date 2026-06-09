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
import {
    fetchLeida,
    useLeidaBus,
} from '../../../../Leida';

type T_SupabaseTable = {
    estimated_rows?: number;
    columns?: unknown[];
    constraints?: unknown[];
};

export default function SupabaseDash() {

    const dispatch = useDispatch();
    const slice = useLeidaBus('/api/supabase');
    const router = useRouter();
    const tables = (Array.isArray(slice?.data) ? slice.data : []) as T_SupabaseTable[];
    const didRequest = React.useRef(false);

    const stats = React.useMemo(() => ({
        tableCount: tables.length,
        columnCount: tables.reduce((acc, t) => acc + (Array.isArray(t.columns) ? t.columns.length : 0), 0),
        constraintCount: tables.reduce((acc, t) => acc + (Array.isArray(t.constraints) ? t.constraints.length : 0), 0),
        knownRows: tables.reduce((acc, t) => acc + (typeof t.estimated_rows === 'number' && t.estimated_rows >= 0 ? t.estimated_rows : 0), 0),
    }), [tables]);

    React.useEffect(() => {
        if (!didRequest.current && !slice?.loading && !slice?.error && tables.length === 0) {
            dispatch(fetchLeida('/api/supabase'));
            didRequest.current = true;
        }
    }, [dispatch, slice?.error, slice?.loading, tables.length]);

    const handleNavigate = () => {
        dispatch(navigateTo(router, '/supabase'));
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
                {slice?.loading && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <CircularProgress size={18} />
                            <Typography variant="body2">Loading Supabase schema...</Typography>
                        </Stack>
                    </Paper>
                )}
                {slice?.error && (
                    <Alert severity="error">{slice.error}</Alert>
                )}
                {!slice?.loading && !slice?.error && tables.length === 0 && (
                    <Alert severity="info">No schema data found.</Alert>
                )}
            </Stack>
        </Box>
    );
}
