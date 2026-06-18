'use client';
import * as React from 'react';
import {
    Box,
    Select,
    Typography,
    MenuItem,
    InputLabel,
    FormControl,
    InputAdornment,
} from '@mui/material';
import type { IconName } from '../../types';
import { Icon } from '../../../../NX/DesignSystem';
import { textFieldSx, selectMenuItemSx } from '../../../Leida';

export default function OptionSelect({
    label,
    options,
    value,
    variant = 'standard',
    onChange,
    disabled = false,
    startAdornment,
}: {
    label?: string;
    options?: any[];
    value?: string | number;
    variant?: 'standard' | 'outlined' | 'filled';
    onChange?: (newValue: string) => void;
    disabled?: boolean;
    startAdornment?: IconName;
}) {

    return (
        <FormControl margin="normal" variant={variant} fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
                variant={variant}
                label={label}
                value={value ?? ''}
                onChange={e => onChange && onChange(String(e.target.value))}
                disabled={disabled}
                sx={textFieldSx}
                startAdornment={startAdornment ? (
                    <InputAdornment position="start">
                        <Box sx={{ mr: 2 }}>
                            <Icon icon={startAdornment} />
                        </Box>
                    </InputAdornment>
                ) : undefined}
            >
                {(options || []).map((opt, idx) => {
                    if (typeof opt === 'object' && opt !== null) {
                        return (
                            <MenuItem key={idx} value={opt.index !== undefined ? opt.index : opt.label || String(opt)} sx={selectMenuItemSx}>
                                <Typography 
                                    variant="body2" 
                                    sx={{}}>
                                    {opt.label || String(opt)}
                                </Typography>
                            </MenuItem>
                        );
                    }
                    return (
                        <MenuItem key={idx} value={String(opt)} sx={selectMenuItemSx}>
                            {String(opt)}
                        </MenuItem>
                    );
                })}
            </Select>
        </FormControl>
    );
}
