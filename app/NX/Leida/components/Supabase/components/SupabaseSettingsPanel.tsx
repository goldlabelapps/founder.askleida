'use client';
import * as React from 'react';
import {
    Chip,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import type { T_SupabaseSchemaData } from '../types';

type T_Props = {
    schema: T_SupabaseSchemaData | null | undefined;
};

export default function SupabaseSettingsPanel({ schema }: T_Props) {
    const allowlist = Array.isArray(schema?.crud_allowed_tables) ? schema.crud_allowed_tables : [];
    const source = schema?.crud_allowlist_source || 'default';

    return (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    CRUD Settings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Allowlist source: {source === 'env' ? 'SUPABASE_ADMIN_TABLE_ALLOWLIST' : 'Built-in default'}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                    {allowlist.map((table) => (
                        <Chip key={table} size="small" color="success" label={table} />
                    ))}
                    {!allowlist.length && (
                        <Chip size="small" variant="outlined" label="No writable tables configured" />
                    )}
                </Stack>
            </Stack>
        </Paper>
    );
}