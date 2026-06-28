"use client";
import * as React from 'react';
import {
	Box,
	Button,
	Checkbox,
	Chip,
	FormControl,
	FormControlLabel,
	FormLabel,
	InputAdornment,
	MenuItem,
	Popover,
	TextField,
	Typography,
} from '@mui/material';
import type { CheckboxProps } from '@mui/material';
import type {
	EditableProps,
	EditableTextProps,
	EditableBooleanProps,
	EditableMultiSelectProps,
	IconName,
} from '../../types';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Icon } from '../../../../NX/DesignSystem';
import { 
	toDayjsOrNull, 
	toHumanDateLabel, 
	textFieldSx, 
	selectMenuItemSx,
} from '../../../../Leida';

export default function Editable({
	id,
	value = '',
	onChange,
	label,
	placeholder,
	disabled = false,
	required = false,
	autoFocus = false,
	multiline = false,
	minRows,
	variant = 'outlined',
	editableType = 'text',
	options,
	checkboxProps,
	startAdornment,
	endAdornment,
}: EditableProps) {
	const renderAdornmentContent = React.useCallback((adornment?: IconName | React.ReactNode) => {
		if (!adornment) return null;
		if (typeof adornment === 'string') {
			return <Icon icon={adornment as IconName} />;
		}
		return adornment;
	}, []);

	const [dateAnchorEl, setDateAnchorEl] = React.useState<HTMLButtonElement | null>(null);

	const handleOpenDatePicker = (event: React.MouseEvent<HTMLButtonElement>) => {
		setDateAnchorEl(event.currentTarget);
	};

	const handleCloseDatePicker = () => {
		setDateAnchorEl(null);
	};

	if (typeof value === 'boolean') {
		const handleBooleanChange = onChange as EditableBooleanProps['onChange'];

		return (
			<FormControlLabel
				label={label || ''}
				control={
					<Checkbox
						checked={value}
						disabled={disabled}
						required={required}
						onChange={(_, checked) => handleBooleanChange?.(checked)}
						{...checkboxProps}
					/>
				}
			/>
		);
	}

	if (Array.isArray(value)) {
		const handleMultiSelectChange = onChange as EditableMultiSelectProps['onChange'];
		const selectedValues = value;

		if (editableType === 'chips') {
			return (
				<Box>
					{label ? (
						<Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
							{label}
						</Typography>
					) : null}
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{(options || []).map((option) => {
							const isSelected = selectedValues.includes(option);

							return (
								<Chip
									key={option}
									label={option}
									clickable={!disabled}
									disabled={disabled}
									color={isSelected ? 'primary' : 'default'}
									variant={isSelected ? 'filled' : 'outlined'}
									onClick={() => {
										if (disabled) {
											return;
										}

										handleMultiSelectChange?.(
											isSelected
												? selectedValues.filter((item) => item !== option)
												: [...selectedValues, option],
										);
									}}
								/>
							);
						})}
					</Box>
				</Box>
			);
		}
	}

	const handleTextChange = onChange as EditableTextProps['onChange'];

	const normalizedValue: string = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';

	if (editableType === 'date') {
		const humanDateLabel = toHumanDateLabel(normalizedValue);
		const selectedDate = toDayjsOrNull(normalizedValue);

		return (
			<>
				<Button
					variant="text"
					color="primary"
					startIcon={<Icon icon="when" />}
					disabled={disabled}
					onClick={handleOpenDatePicker}
					aria-label={label || 'Select date'}
				>
					{humanDateLabel}
				</Button>
				<Popover
					open={Boolean(dateAnchorEl)}
					anchorEl={dateAnchorEl}
					onClose={handleCloseDatePicker}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				>
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DateCalendar
							value={selectedDate}
							disabled={disabled}
							onChange={(nextDate) => {
								handleTextChange?.(nextDate ? nextDate.format('YYYY-MM-DD') : '');
								if (nextDate || !required) {
									handleCloseDatePicker();
								}
							}}
						/>
					</LocalizationProvider>
				</Popover>
			</>
		);
	}

	if (editableType === 'select') {
		const isEmpty = normalizedValue.trim().length === 0;
		const selectPlaceholder = placeholder || `Select ${label?.toLowerCase() || 'option'}`;

		return (
			<FormControl fullWidth>
				{label ? (
					<FormLabel sx={{ mb: 1, fontSize: '0.875rem' }} required={required}>
						{label}
					</FormLabel>
				) : null}
				<TextField
					id={id}
					select
					fullWidth
					variant={variant}
					value={normalizedValue}
					disabled={disabled}
					required={required}
					autoFocus={autoFocus}
					sx={textFieldSx}
					slotProps={{
						select: {
							sx: {
								fontSize: { xs: '1rem', sm: '2rem' },
							},
						},
						input: {
							startAdornment: startAdornment ? (
								<InputAdornment position="start">
									{renderAdornmentContent(startAdornment)}
								</InputAdornment>
							) : undefined,
							endAdornment: endAdornment ? (
								<InputAdornment position="end">
									{renderAdornmentContent(endAdornment)}
								</InputAdornment>
							) : undefined,
						},
					}}
					onChange={(event) => handleTextChange?.(event.target.value)}
				>
					{!required ? (
						<MenuItem value="" sx={selectMenuItemSx}>
							{selectPlaceholder}
						</MenuItem>
					) : null}
					{(options || []).map((option) => (
						<MenuItem key={option} value={option} sx={selectMenuItemSx}>
							{option}
						</MenuItem>
					))}
				</TextField>
			</FormControl>
		);
	}

	return (
		<FormControl fullWidth>
			{label ? (
				<FormLabel sx={{ mb: 1, fontSize: '0.875rem' }} required={required}>
					{label}
				</FormLabel>
			) : null}
			<TextField
				id={id}
				fullWidth
				variant={variant}
				placeholder={placeholder}
				value={normalizedValue}
				disabled={disabled}
				required={required}
				autoFocus={autoFocus}
				multiline={multiline}
				minRows={minRows}
				sx={textFieldSx}
				slotProps={{
					input: {
						startAdornment: startAdornment ? (
							<InputAdornment position="start">
								<Box sx={{ mr: 2 }}>
									{renderAdornmentContent(startAdornment)}
								</Box>
							</InputAdornment>
						) : undefined,
						endAdornment: endAdornment ? (
							<InputAdornment position="end">
								{renderAdornmentContent(endAdornment)}
							</InputAdornment>
						) : undefined,
					},
				}}
				onChange={(event) => handleTextChange?.(event.target.value)}
			/>
		</FormControl>
	);
}
