'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Chip,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { setNXAdmin } from '../../../../NX/NXAdmin';
import {
    useDash,
} from '../../../../Leida';
import { initSupabase } from '../actions/initSupabase';
import { fetchSupabaseSchema } from '../actions/fetchSupabaseSchema';
import { fetchSupabaseRows } from '../actions/fetchSupabaseRows';
import { fetchSupabaseAuthUsers } from '../actions/fetchSupabaseAuthUsers';
import { saveSupabaseRecord } from '../actions/saveSupabaseRecord';
import { deleteSupabaseRecord } from '../actions/deleteSupabaseRecord';
import { setSupabase } from '../actions/setSupabase';
import { useSupabase } from '../hooks/useSupabase';
import type { T_SupabaseTable } from '../types';
import SupabaseSchemaPanel from './SupabaseSchemaPanel';
import SupabaseRowsPanel from './SupabaseRowsPanel';
import SupabaseAuthPanel from './SupabaseAuthPanel';
import SupabaseSettingsPanel from './SupabaseSettingsPanel';

function formatEstimatedRows(value?: number): string {
    if (typeof value !== 'number') return 'N/A';
    if (value < 0) return 'Unknown';
    return value.toLocaleString();
}


export default function SupabasePostgres() {

    const dispatch = useDispatch();
    const dash = useDash();
    const supabase = useSupabase();
    const schema = supabase?.schema || null;
    const tables = (Array.isArray(schema?.tables) ? schema.tables : []) as T_SupabaseTable[];
    const activeTableName = typeof supabase?.activeTable === 'string' ? supabase.activeTable : null;
    const activeTable = tables.find((table) => table?.table_name === activeTableName) || null;
    const rowsState = activeTableName ? (supabase?.rowsByTable?.[activeTableName] || null) : null;

    React.useEffect(() => {
        if (!supabase?.initted) {
            dispatch(initSupabase());
        }
    }, [dispatch, supabase?.initted]);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Supabase Postgres',
                icon: 'supabase',
            }));
        }
    }, [dispatch, dash?.title]);

    React.useEffect(() => {
        if (!activeTableName) return;
        if (!activeTable?.crud_allowed) return;
        const hasRows = Array.isArray(rowsState?.rows) && rowsState.rows.length > 0;
        if (!rowsState?.loading && !rowsState?.error && !hasRows) {
            dispatch(fetchSupabaseRows({ table: activeTableName }));
        }
    }, [dispatch, activeTable?.crud_allowed, activeTableName, rowsState?.error, rowsState?.loading, rowsState?.rows]);

    const handleSelectTable = (tableName: string) => {
        dispatch(setSupabase('activeTable', tableName));
    };

    const handleCreateRow = async (tableName: string, values: Record<string, any>) => {
        await dispatch(saveSupabaseRecord({ table: tableName, values }));
    };

    const handleUpdateRow = async (tableName: string, match: Record<string, any>, values: Record<string, any>) => {
        await dispatch(saveSupabaseRecord({ table: tableName, match, values }));
    };

    const handleDeleteRow = async (tableName: string, match: Record<string, any>) => {
        await dispatch(deleteSupabaseRecord({ table: tableName, match }));
    };

    const handleSaveUser = async (args: {
        userId?: string;
        email: string;
        password?: string;
        phone?: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, any>;
        app_metadata?: Record<string, any>;
    }) => {
        await dispatch(saveSupabaseRecord({ resource: 'auth-user', ...args }));
    };

    const handleDeleteUser = async (userId: string) => {
        await dispatch(deleteSupabaseRecord({ resource: 'auth-user', userId }));
    };

    return (
        <Box sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    <Chip size="small" label={`${tables.length} tables`} />
                    <Chip size="small" variant="outlined" label={`${formatEstimatedRows(schema?.auth?.user_count)} auth users`} />
                </Stack>

                {(supabase?.schemaError || supabase?.authError) && (
                    <Alert severity="error">
                        {supabase?.schemaError || supabase?.authError}
                    </Alert>
                )}

                <SupabaseSettingsPanel schema={schema} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                        <SupabaseSchemaPanel
                            schema={schema}
                            activeTable={activeTableName}
                            loading={supabase?.schemaLoading}
                            error={supabase?.schemaError}
                            onSelectTable={handleSelectTable}
                            onRefresh={() => dispatch(fetchSupabaseSchema())}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                        <SupabaseRowsPanel
                            table={activeTable}
                            rowsState={rowsState}
                            onRefresh={(tableName) => dispatch(fetchSupabaseRows({ table: tableName }))}
                            onCreate={handleCreateRow}
                            onUpdate={handleUpdateRow}
                            onDelete={handleDeleteRow}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <SupabaseAuthPanel
                            loading={supabase?.authLoading}
                            error={supabase?.authError}
                            users={Array.isArray(supabase?.authUsers) ? supabase.authUsers : []}
                            total={supabase?.authTotal}
                            page={supabase?.authPage}
                            perPage={supabase?.authPerPage}
                            onRefresh={() => dispatch(fetchSupabaseAuthUsers({
                                page: typeof supabase?.authPage === 'number' ? supabase.authPage : 1,
                                perPage: typeof supabase?.authPerPage === 'number' ? supabase.authPerPage : 10,
                            }))}
                            onPageChange={(page) => dispatch(fetchSupabaseAuthUsers({
                                page,
                                perPage: typeof supabase?.authPerPage === 'number' ? supabase.authPerPage : 10,
                            }))}
                            onSave={handleSaveUser}
                            onDelete={handleDeleteUser}
                        />
                    </Grid>
                </Grid>

                {activeTable && (
                    <Stack spacing={1}>
                        <Typography variant="subtitle2">Columns in {activeTable.table_name}</Typography>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                            {(Array.isArray(activeTable.columns) ? activeTable.columns : []).map((column, index) => {
                                const nullable = column.nullable ? 'NULL' : 'NOT NULL';
                                const typeLabel = column.udt_name || column.data_type || 'unknown';
                                const label = `${column.name || `col_${index + 1}`}: ${typeLabel} (${nullable})`;
                                return <Chip key={`${activeTable.table_name}-column-${column.name || index}`} size="small" variant="outlined" label={label} />;
                            })}
                        </Stack>
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}