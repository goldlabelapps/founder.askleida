export const isValidEmail = (value: string) => {
	const email = value.trim().toLowerCase();
	if (!email) return false;

	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};