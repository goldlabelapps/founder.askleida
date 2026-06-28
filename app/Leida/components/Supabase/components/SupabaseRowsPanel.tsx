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
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { buildMatch } from '../../../lib/buildMatch';
import { getSupabaseFieldValue } from '../../../lib/getSupabaseFieldValue';
import { getTableFormPreset } from '../../../lib/getTableFormPreset';
import { isBooleanColumn } from '../../../lib/isBooleanColumn';
import { isJsonColumn } from '../../../lib/isJsonColumn';
import { isNumericColumn } from '../../../lib/isNumericColumn';
import { normalizeColumnsForPreset } from '../../../lib/normalizeColumnsForPreset';
import { parseJsonRecord } from '../../../lib/parseJsonRecord';
import { parseSupabaseFieldValue } from '../../../lib/parseSupabaseFieldValue';
import { previewValue } from '../../../lib/previewValue';
import { stringifyJson } from '../../../lib/stringifyJson';
import type { T_SupabaseRowsPanelProps, T_TableFormPreset } from '../../../types.d';

const DEFAULT_HIDDEN_FIELDS = ['created', 'updated'];

const TABLE_PRESETS: Record<string, T_TableFormPreset> = {
    products: {
        fieldOrder: [
            'name',
            'title',
            'description',
            'category',
            'sku',
            'price',
            'practitioner_id',
            'notes',
            'data',
            'product_id',
        ],
        hiddenFields: [...DEFAULT_HIDDEN_FIELDS],
        labels: {
            product_id: 'Product ID',
            practitioner_id: 'Practitioner ID',
            sku: 'SKU',
            data: 'Data JSON',
        },
        selectOptions: {
            category: ['supplement', 'skincare', 'device', 'tool', 'service', 'other'],
        },
    },
    practitioners: {
        fieldOrder: [
            'name',
            'email',
            'phone',
            'specialty',
            'location',
            'status',
            'notes',
            'data',
            'practitioner_id',
        ],
        hiddenFields: [...DEFAULT_HIDDEN_FIELDS],
        labels: {
            practitioner_id: 'Practitioner ID',
            data: 'Data JSON',
        },
        selectOptions: {
            status: ['active', 'inactive'],
        },
    },
};

export default function SupabaseRowsPanel({ table, rowsState, onRefresh, onCreate, onUpdate, onDelete }: T_SupabaseRowsPanelProps) {
    const tableName = table?.table_name || null;
    const preset = React.useMemo(() => getTableFormPreset(tableName, TABLE_PRESETS), [tableName]);
    const crudAllowed = table?.crud_allowed !== false;
    const rows = Array.isArray(rowsState?.rows) ? rowsState?.rows : [];
    const primaryKeys = Array.isArray(rowsState?.primaryKeys) ? rowsState.primaryKeys : (Array.isArray(table?.primary_keys) ? table.primary_keys : []);
    const columnsRaw = Array.isArray(rowsState?.columns) && rowsState?.columns?.length ? rowsState.columns : (Array.isArray(table?.columns) ? table.columns : []);
    const columns = React.useMemo(() => normalizeColumnsForPreset(columnsRaw, preset), [columnsRaw, preset]);
    const visibleColumns = columns.slice(0, 6);
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
    const [draft, setDraft] = React.useState('{}');
    const [error, setError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [editorMode, setEditorMode] = React.useState<'guided' | 'json'>('guided');

    const parsedDraft = React.useMemo(() => {
        try {
            return parseJsonRecord(draft);
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
            next[columnName] = parseSupabaseFieldValue(rawValue, column);
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
            const values = parseJsonRecord(draft);
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
                            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                                <Typography variant="subtitle2">Editor mode</Typography>
                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={editorMode}
                                    onChange={(_, value) => {
                                        if (value) {
                                            setEditorMode(value);
                                        }
                                    }}
                                >
                                    <ToggleButton value="guided">Simplified</ToggleButton>
                                    <ToggleButton value="json">Raw JSON</ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>

                            {editorMode === 'guided' && columns.length > 0 && parsedDraft && (
                                <Stack spacing={1}>
                                    <Typography variant="subtitle2">Column-aware editor</Typography>
                                    {columns.map((column, index) => {
                                        const columnName = column.name || `column_${index + 1}`;
                                        const value = getSupabaseFieldValue(parsedDraft, column, columnName);
                                        const isPrimaryKey = primaryKeys.includes(columnName);
                                        const disabled = !crudAllowed || (Boolean(selectedRow) && isPrimaryKey);
                                        const displayLabel = preset.labels?.[columnName] || columnName;
                                        const selectOptions = Array.isArray(preset.selectOptions?.[columnName]) ? preset.selectOptions?.[columnName] : null;

                                        if (isBooleanColumn(column.data_type, column.udt_name)) {
                                            return (
                                                <TextField
                                                    key={columnName}
                                                    select
                                                    label={displayLabel}
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

                                        if (selectOptions && selectOptions.length > 0) {
                                            return (
                                                <TextField
                                                    key={columnName}
                                                    select
                                                    label={displayLabel}
                                                    value={value}
                                                    onChange={(event) => handleFieldChange(columnName, event.target.value)}
                                                    helperText={`${column.udt_name || column.data_type || 'text'}${column.nullable ? ' nullable' : ''}${isPrimaryKey ? ' primary key' : ''}`}
                                                    disabled={disabled}
                                                >
                                                    {column.nullable && <MenuItem value="">Unset</MenuItem>}
                                                    {selectOptions.map((option) => (
                                                        <MenuItem key={`${columnName}-${option}`} value={option}>
                                                            {option}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            );
                                        }

                                        return (
                                            <TextField
                                                key={columnName}
                                                label={displayLabel}
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

                            {editorMode === 'json' && (
                                <>
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
                                </>
                            )}
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
