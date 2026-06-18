'use client';
import * as React from 'react';
import {
    Box,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    InputAdornment,
} from '@mui/material';
import type { IconName } from '../../types';
import { useDispatch } from '../../../../NX/Uberedux';
import { setNXAdmin, useCRUD } from '../../../NXAdmin'
import { Icon } from '../../../../NX/DesignSystem';

export default function OptionSelect({
    label,
    options,
    value,
    variant = 'standard',
    collection,
    onChange,
    disabled = false,
    startAdornment,
}: {
    label?: string;
    options?: any[];
    value?: string | number;
    variant?: 'standard' | 'outlined' | 'filled';
    field?: string;
    collection?: string;
    onChange?: (newValue: string) => void;
    disabled?: boolean;
    startAdornment?: IconName;
}) {

    const dispatch = useDispatch();
    const crud = useCRUD();
    const state = collection ? crud[collection] : undefined;

    const handleClick = () => {
        console.log('collection', collection);
        dispatch(setNXAdmin('active', null));
    };
    
    return (
        <FormControl margin="normal" variant={variant} fullWidth>
            <InputLabel>{label}</InputLabel>
            <Select
                variant={variant}
                label={label}
                value={value ?? ''}
                onChange={e => onChange && onChange(String(e.target.value))}
                disabled={disabled}
                startAdornment={startAdornment ? (
                    <InputAdornment position="start">
                        <Box sx={{ my: 2, pb: 1 }}>
                            <Icon icon={startAdornment} />
                        </Box>
                    </InputAdornment>
                ) : undefined}
                
            >
                {(options || []).map((opt, idx) => {
                    if (typeof opt === 'object' && opt !== null) {
                        return (
                            <MenuItem key={idx} value={opt.index !== undefined ? opt.index : opt.label || String(opt)}>
                                {opt.label || String(opt)}
                            </MenuItem>
                        );
                    }
                    return (
                        <MenuItem key={idx} value={String(opt)}>
                            {String(opt)}
                        </MenuItem>
                    );
                })}
            </Select>
        </FormControl>
    );
}
