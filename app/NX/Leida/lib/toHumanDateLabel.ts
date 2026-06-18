import dayjs from 'dayjs';

export const toHumanDateLabel = (value: string): string => {
	if (!value.trim()) {
		return 'Select date';
	}

	const parsed = dayjs(value);
	if (!parsed.isValid()) {
		return value;
	}

	return parsed.format('D MMMM YYYY');
};
