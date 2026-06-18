import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

export const toDayjsOrNull = (value: string): Dayjs | null => {
	if (!value.trim()) {
		return null;
	}

	const parsed = dayjs(value);
	if (!parsed.isValid()) {
		return null;
	}

	return parsed;
};
