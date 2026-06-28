'use client';
import * as React from 'react';
import {
    Alert,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { formatNumber } from '../../../lib/formatNumber';
import type { T_SupabaseSchemaPanelProps } from '../../../types.d';

export default function SupabaseSchemaPanel({
    schema,
    activeTable,
    loading,
    error,
    onSelectTable,
    onRefresh,
}: T_SupabaseSchemaPanelProps) {
    const tables = Array.isArray(schema?.tables) ? schema?.tables : [];

    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <div>
                        <Typography variant="h6">Schema</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {schema?.database?.name || 'Unknown database'}
                        </Typography>
                    </div>
                    <Button variant="outlined" size="small" onClick={onRefresh} disabled={loading}>
                        Refresh
                    </Button>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    <Chip size="small" label={`${formatNumber(schema?.table_count)} tables`} />
                    <Chip size="small" variant="outlined" label={`${formatNumber(schema?.auth?.user_count)} auth users`} />
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}

                <Stack spacing={1} sx={{ maxHeight: 520, overflowY: 'auto' }}>
                    {tables.map((table) => {
                        const tableName = table?.table_name || 'untitled_table';
                        const selected = tableName === activeTable;
                        return (
                            <Paper
                                key={tableName}
                                variant={selected ? 'elevation' : 'outlined'}
                                elevation={selected ? 2 : 0}
                                sx={{
                                    p: 1.25,
                                    cursor: 'pointer',
                                    borderColor: selected ? 'primary.main' : undefined,
                                }}
                                onClick={() => onSelectTable(tableName)}
                            >
                                <Stack spacing={0.75}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {tableName}
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                                        <Chip size="small" variant="outlined" label={`${formatNumber(table?.estimated_rows)} rows`} />
                                        <Chip size="small" variant="outlined" label={`${Array.isArray(table?.columns) ? table.columns.length : 0} cols`} />
                                        <Chip size="small" variant="outlined" label={`${Array.isArray(table?.primary_keys) ? table.primary_keys.length : 0} pk`} />
                                        <Chip
                                            size="small"
                                            color={table?.crud_allowed ? 'success' : 'default'}
                                            variant={table?.crud_allowed ? 'filled' : 'outlined'}
                                            label={table?.crud_allowed ? 'CRUD enabled' : 'Read only'}
                                        />
                                    </Stack>
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>

                {Array.isArray(schema?.crud_allowed_tables) && schema.crud_allowed_tables.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                        Allowed CRUD tables: {schema.crud_allowed_tables.join(', ')}
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
}
