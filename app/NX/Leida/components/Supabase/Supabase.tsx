'use client';
import * as React from 'react';
import {
    Box,
    Chip,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../Uberedux';
import { setNXAdmin } from '../../../NXAdmin';
import {
    useDash,
    useLeidaBus,
} from '../../../Leida';

type T_SupabaseColumn = {
    name?: string;
    data_type?: string;
    udt_name?: string;
    nullable?: boolean;
    default?: string | null;
};

type T_SupabaseConstraint = {
    column_name?: string;
    constraint_type?: string;
    constraint_name?: string;
};

type T_SupabaseTable = {
    table_name?: string;
    estimated_rows?: number;
    columns?: T_SupabaseColumn[];
    constraints?: T_SupabaseConstraint[];
};

function formatEstimatedRows(value?: number): string {
    if (typeof value !== 'number') return 'N/A';
    if (value < 0) return 'Unknown';
    return value.toLocaleString();
}


export default function Supabase() {
    
    const dispatch = useDispatch();
    const slice = useLeidaBus('/api/supabase');
    const dash = useDash();
    const tables = (Array.isArray(slice?.data) ? slice.data : []) as T_SupabaseTable[];

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Supabase',
                icon: 'supabase',
            }));
        }
    }, [dispatch, dash?.title]);

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Grid container spacing={1.5}>
                    {tables.map((table) => {
                        const tableName = table.table_name || 'untitled_table';
                        const columns = Array.isArray(table.columns) ? table.columns : [];
                        const constraints = Array.isArray(table.constraints) ? table.constraints : [];

                        return (
                            <Grid key={tableName} size={{ xs: 12, md: 6, lg: 4 }}>
                                <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
                                    <Stack spacing={1}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {tableName}
                                            </Typography>
                                            <Chip size="small" label={`${formatEstimatedRows(table.estimated_rows)} rows`} />
                                        </Stack>

                                        <Stack direction="row" spacing={1}>
                                            <Chip size="small" variant="outlined" label={`${columns.length} cols`} />
                                            <Chip size="small" variant="outlined" label={`${constraints.length} keys`} />
                                        </Stack>

                                        {constraints.length > 0 && (
                                            <Box>
                                                <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
                                                    {constraints.map((constraint, i) => {
                                                        const label = `${constraint.constraint_type || 'constraint'}: ${constraint.column_name || 'column'}`;
                                                        return (
                                                            <Chip
                                                                key={`${tableName}-constraint-${constraint.constraint_name || i}`}
                                                                size="small"
                                                                color="secondary"
                                                                variant="outlined"
                                                                label={label}
                                                            />
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        )}
                                        <Divider />

                                        <Box>
                                            
                                            <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.75 }}>
                                                {columns.map((column, i) => {
                                                    const nullable = column.nullable ? 'NULL' : 'NOT NULL';
                                                    const typeLabel = column.udt_name || column.data_type || 'unknown';
                                                    const label = `${column.name || `col_${i + 1}`}: ${typeLabel} (${nullable})`;
                                                    return (
                                                        <Chip
                                                            key={`${tableName}-col-${column.name || i}`}
                                                            size="small"
                                                            variant="outlined"
                                                            label={label}
                                                        />
                                                    );
                                                })}
                                            </Stack>
                                        </Box>

                                    </Stack>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Stack>
        </Box>
    );
}
