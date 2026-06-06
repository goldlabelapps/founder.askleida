import * as React from 'react';
import { Box, Button, Checkbox, Chip, FormControlLabel, MenuItem, Popover, TextField, Typography } from '@mui/material';
import type { CheckboxProps } from '@mui/material';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Icon } from '../../../DesignSystem';

type EditableBaseProps = {
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	autoFocus?: boolean;
	multiline?: boolean;
	minRows?: number;
    variant?: 'standard' | 'outlined' | 'filled';
	editableType?: 'text' | 'date' | 'select' | 'chips';
	options?: readonly string[];
	checkboxProps?: Omit<CheckboxProps, 'checked' | 'onChange' | 'disabled' | 'required'>;
};

type EditableTextProps = EditableBaseProps & {
	value?: string | number;
	onChange?: (value: string) => void;
	checkboxProps?: never;
};

type EditableMultiSelectProps = EditableBaseProps & {
	value: string[];
	onChange?: (value: string[]) => void;
	checkboxProps?: never;
};

type EditableBooleanProps = EditableBaseProps & {
	value: boolean;
	onChange?: (value: boolean) => void;
	checkboxProps?: Omit<CheckboxProps, 'checked' | 'onChange' | 'disabled' | 'required'>;
};

export type EditableProps = EditableTextProps | EditableBooleanProps | EditableMultiSelectProps;

const toDayjsOrNull = (value: string): Dayjs | null => {
	if (!value.trim()) {
		return null;
	}

	const parsed = dayjs(value);
	if (!parsed.isValid()) {
		return null;
	}

	return parsed;
};

const toHumanDateLabel = (value: string): string => {
	if (!value.trim()) {
		return 'Select date';
	}

	const parsed = dayjs(value);
	if (!parsed.isValid()) {
		return value;
	}

	return parsed.format('D MMMM YYYY');
};

export default function Editable({
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
}: EditableProps) {
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
					startIcon={<Icon icon="date" />}
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
			<TextField
				select
				fullWidth
				variant={variant}
				label={label}
				value={normalizedValue}
				disabled={disabled}
				required={required}
				autoFocus={autoFocus}
				onChange={(event) => handleTextChange?.(event.target.value)}
			>
				{!required ? <MenuItem value="">{selectPlaceholder}</MenuItem> : null}
				{(options || []).map((option) => (
					<MenuItem key={option} value={option}>
						{option}
					</MenuItem>
				))}
			</TextField>
		);
	}

	const isEmpty = normalizedValue.trim().length === 0;

	return (
		<TextField
			sx={{
				// '& .MuiInputBase-root': {
				// 	backgroundColor: isEmpty ? 
				// 		'rgba(255, 255, 255, 0.25)' : 
				// 		'rgba(255, 255, 255, 0.75)',
				// },
			}}
			fullWidth
			variant={variant}
			label={label}
			placeholder={placeholder}
			value={normalizedValue}
			disabled={disabled}
			required={required}
			autoFocus={autoFocus}
			multiline={multiline}
			minRows={minRows}
			onChange={(event) => handleTextChange?.(event.target.value)}
		/>
	);
}
