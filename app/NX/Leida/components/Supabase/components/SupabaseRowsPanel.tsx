'use client';
import * as React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import type { T_SupabaseColumn, T_SupabaseRowsState, T_SupabaseTable } from '../types';

type T_Props = {
    table: T_SupabaseTable | null;
    rowsState: T_SupabaseRowsState | null;
    onRefresh: (tableName: string) => void;
    onCreate: (tableName: string, values: Record<string, any>) => Promise<void>;
    onUpdate: (tableName: string, match: Record<string, any>, values: Record<string, any>) => Promise<void>;
    onDelete: (tableName: string, match: Record<string, any>) => Promise<void>;
};

const NUMERIC_TYPES = new Set(['int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'integer', 'bigint', 'smallint', 'real', 'double precision']);
const BOOLEAN_TYPES = new Set(['bool', 'boolean']);
const JSON_TYPES = new Set(['json', 'jsonb']);

function stringifyJson(value: unknown): string {
    try {
        return JSON.stringify(value ?? {}, null, 2);
    } catch {
        return '{}';
    }
}

function parseJson(text: string): Record<string, any> {
    const parsed = JSON.parse(text || '{}');
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Row payload must be a JSON object');
    }
    return parsed;
}

function isNumericColumn(dataType?: string, udtName?: string): boolean {
    return NUMERIC_TYPES.has(String(udtName || '').toLowerCase()) || NUMERIC_TYPES.has(String(dataType || '').toLowerCase());
}

function isBooleanColumn(dataType?: string, udtName?: string): boolean {
    return BOOLEAN_TYPES.has(String(udtName || '').toLowerCase()) || BOOLEAN_TYPES.has(String(dataType || '').toLowerCase());
}

function isJsonColumn(dataType?: string, udtName?: string): boolean {
    return JSON_TYPES.has(String(udtName || '').toLowerCase()) || JSON_TYPES.has(String(dataType || '').toLowerCase());
}

function buildMatch(primaryKeys: string[], row: Record<string, any> | undefined): Record<string, any> | null {
    if (!row || !primaryKeys.length) return null;
    const match: Record<string, any> = {};

    for (const key of primaryKeys) {
        if (!(key in row)) {
            return null;
        }
        match[key] = row[key];
    }

    return match;
}

function previewValue(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
        const stringified = stringifyJson(value);
        return stringified.length > 60 ? `${stringified.slice(0, 57)}...` : stringified;
    }
    return String(value);
}

function getFieldValue(draftObject: Record<string, any>, column: T_SupabaseColumn, columnName: string): string {
    const current = draftObject[columnName];
    if (current === undefined || current === null) {
        return '';
    }

    if (isJsonColumn(column.data_type, column.udt_name)) {
        return stringifyJson(current);
    }

    if (isBooleanColumn(column.data_type, column.udt_name)) {
        if (current === true) return 'true';
        if (current === false) return 'false';
        return '';
    }

    return String(current);
}

function parseFieldValue(rawValue: string, column: T_SupabaseColumn): unknown {
    if (rawValue === '') {
        return column.nullable ? null : '';
    }

    if (isJsonColumn(column.data_type, column.udt_name)) {
        return JSON.parse(rawValue);
    }

    if (isBooleanColumn(column.data_type, column.udt_name)) {
        if (rawValue === 'true') return true;
        if (rawValue === 'false') return false;
        return column.nullable ? null : false;
    }

    if (isNumericColumn(column.data_type, column.udt_name)) {
        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed)) {
            throw new Error(`Invalid number for ${column.udt_name || column.data_type || 'numeric field'}`);
        }
        return parsed;
    }

    return rawValue;
}

export default function SupabaseRowsPanel({ table, rowsState, onRefresh, onCreate, onUpdate, onDelete }: T_Props) {
    const tableName = table?.table_name || null;
    const crudAllowed = table?.crud_allowed !== false;
    const rows = Array.isArray(rowsState?.rows) ? rowsState?.rows : [];
    const primaryKeys = Array.isArray(rowsState?.primaryKeys) ? rowsState.primaryKeys : (Array.isArray(table?.primary_keys) ? table.primary_keys : []);
    const columns = Array.isArray(rowsState?.columns) && rowsState?.columns?.length ? rowsState.columns : (Array.isArray(table?.columns) ? table.columns : []);
    const visibleColumns = columns.slice(0, 6);
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
    const [draft, setDraft] = React.useState('{}');
    const [error, setError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);

    const parsedDraft = React.useMemo(() => {
        try {
            return parseJson(draft);
        } catch {
            return null;
        }
    }, [draft]);

    React.useEffect(() => {
        setSelectedIndex(null);
        setDraft('{}');
        setError(null);
    }, [tableName]);

    React.useEffect(() => {
        if (selectedIndex === null) {
            return;
        }

        const nextRow = rows[selectedIndex];
        if (!nextRow) {
            setSelectedIndex(null);
            setDraft('{}');
            return;
        }

        setDraft(stringifyJson(nextRow));
    }, [rows, selectedIndex]);

    const selectedRow = selectedIndex === null ? undefined : rows[selectedIndex];
    const rowMatch = buildMatch(primaryKeys, selectedRow);

    const handleCreateNew = () => {
        setSelectedIndex(null);
        setDraft('{}');
        setError(null);
    };

    const handleSelectRow = (index: number) => {
        setSelectedIndex(index);
        setDraft(stringifyJson(rows[index] || {}));
        setError(null);
    };

    const handleFieldChange = (columnName: string, rawValue: string) => {
        const column = columns.find((item) => item?.name === columnName);
        if (!column) {
            return;
        }

        try {
            const next = { ...(parsedDraft || {}) };
            next[columnName] = parseFieldValue(rawValue, column);
            setDraft(stringifyJson(next));
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const handleSave = async () => {
        if (!tableName || !crudAllowed) return;

        setSaving(true);
        setError(null);
        try {
            const values = parseJson(draft);
            if (selectedRow && rowMatch) {
                const nextValues = { ...values };
                for (const key of Object.keys(rowMatch)) {
                    delete nextValues[key];
                }
                await onUpdate(tableName, rowMatch, nextValues);
            } else {
                await onCreate(tableName, values);
            }
            if (!selectedRow) {
                setDraft('{}');
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!tableName || !crudAllowed || !rowMatch) return;
        if (typeof window !== 'undefined' && !window.confirm(`Delete row from ${tableName}?`)) return;

        setSaving(true);
        setError(null);
        try {
            await onDelete(tableName, rowMatch);
            setSelectedIndex(null);
            setDraft('{}');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <div>
                        <Typography variant="h6">Rows</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {tableName || 'Select a table'}
                        </Typography>
                    </div>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" onClick={handleCreateNew} disabled={!tableName || !crudAllowed || saving}>
                            New row
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => tableName && onRefresh(tableName)} disabled={!tableName || !crudAllowed || rowsState?.loading}>
                            Refresh
                        </Button>
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    <Chip size="small" label={`${rowsState?.count || 0} loaded`} />
                    <Chip size="small" variant="outlined" label={`${primaryKeys.length} primary keys`} />
                </Stack>

                {rowsState?.error && <Alert severity="error">{rowsState.error}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
                {!tableName && <Alert severity="info">Choose a public table from the schema list.</Alert>}
                {tableName && !crudAllowed && (
                    <Alert severity="info">This table is read-only in the admin UI. Add it to SUPABASE_ADMIN_TABLE_ALLOWLIST to enable row CRUD.</Alert>
                )}
                {tableName && primaryKeys.length === 0 && (
                    <Alert severity="warning">This table has no detected primary key. Create works, but update and delete are disabled.</Alert>
                )}

                {tableName && (
                    <>
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {visibleColumns.map((column) => (
                                            <TableCell key={column?.name || 'column'}>{column?.name || 'column'}</TableCell>
                                        ))}
                                        <TableCell align="right">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row, index) => (
                                        <TableRow key={`${tableName}-row-${index}`} selected={selectedIndex === index} hover>
                                            {visibleColumns.map((column) => (
                                                <TableCell key={`${tableName}-${index}-${column?.name || 'column'}`}>
                                                    {previewValue(row?.[column?.name || ''])}
                                                </TableCell>
                                            ))}
                                            <TableCell align="right">
                                                <Button size="small" onClick={() => handleSelectRow(index)}>
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>

                        <Divider />

                        <Stack spacing={1}>
                            {columns.length > 0 && parsedDraft && (
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2">Column-aware editor</Typography>
                                    {columns.map((column, index) => {
                                        const columnName = column.name || `column_${index + 1}`;
                                        const value = getFieldValue(parsedDraft, column, columnName);
                                        const isPrimaryKey = primaryKeys.includes(columnName);
                                        const disabled = !crudAllowed || (Boolean(selectedRow) && isPrimaryKey);

                                        if (isBooleanColumn(column.data_type, column.udt_name)) {
                                            return (
                                                <TextField
                                                    key={columnName}
                                                    select
                                                    label={columnName}
                                                    value={value}
                                                    onChange={(event) => handleFieldChange(columnName, event.target.value)}
                                                    helperText={`${column.udt_name || column.data_type || 'boolean'}${column.nullable ? ' nullable' : ''}${isPrimaryKey ? ' primary key' : ''}`}
                                                    disabled={disabled}
                                                >
                                                    <MenuItem value="">Unset</MenuItem>
                                                    <MenuItem value="true">True</MenuItem>
                                                    <MenuItem value="false">False</MenuItem>
                                                </TextField>
                                            );
                                        }

                                        return (
                                            <TextField
                                                key={columnName}
                                                label={columnName}
                                                value={value}
                                                onChange={(event) => handleFieldChange(columnName, event.target.value)}
                                                type={isNumericColumn(column.data_type, column.udt_name) ? 'number' : 'text'}
                                                multiline={isJsonColumn(column.data_type, column.udt_name)}
                                                minRows={isJsonColumn(column.data_type, column.udt_name) ? 4 : undefined}
                                                helperText={`${column.udt_name || column.data_type || 'text'}${column.nullable ? ' nullable' : ''}${isPrimaryKey ? ' primary key' : ''}`}
                                                disabled={disabled}
                                            />
                                        );
                                    })}
                                </Stack>
                            )}

                            <Typography variant="subtitle2">
                                {selectedRow ? 'Selected row JSON' : 'New row JSON'}
                            </Typography>
                            {selectedRow && rowMatch && (
                                <Typography variant="caption" color="text.secondary">
                                    Match: {stringifyJson(rowMatch)}
                                </Typography>
                            )}
                            <TextField
                                multiline
                                minRows={14}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="{}"
                            />
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" onClick={handleSave} disabled={!tableName || !crudAllowed || saving}>
                                    {selectedRow ? 'Update row' : 'Create row'}
                                </Button>
                                <Button
                                    color="error"
                                    variant="outlined"
                                    onClick={handleDelete}
                                    disabled={!selectedRow || !rowMatch || !crudAllowed || saving}
                                >
                                    Delete row
                                </Button>
                            </Stack>
                        </Stack>
                    </>
                )}
            </Stack>
        </Paper>
    );
}
