import type { Dispatch } from 'redux';
import { setUbereduxKey } from '../../../../NX/Uberedux';

type T_FetchAWINFeedIngestPreflightResult = {
	ok: true;
	message: string;
	configured: boolean;
	skippedIngest: boolean;
	rowLimit: number | null;
	csvRows: number | null;
	upserted: number | null;
	skipped: number | null;
} | {
	ok: false;
	error: string;
};

export const fetchAWINFeedIngestPreflight = (): any =>
	async (dispatch: Dispatch): Promise<T_FetchAWINFeedIngestPreflightResult> => {
		try {
			const res = await fetch('/api/awin/lookfantastic/ingest?&category=Skincare', {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
				cache: 'no-store',
			});

			const json = await res.json().catch(() => null);

			if (!res.ok) {
				const message = json?.message || `Failed to load AWIN products (${res.status})`;
				throw new Error(message);
			}

			return {
				ok: true,
				message: typeof json?.message === 'string'
					? json.message
					: 'AWIN products loaded successfully.',
				configured: json?.data?.configured !== false,
				skippedIngest: json?.data?.skipped === true,
				rowLimit: typeof json?.data?.rowLimit === 'number' ? json.data.rowLimit : 300,
				csvRows: typeof json?.data?.csvRows === 'number' ? json.data.csvRows : null,
				upserted: typeof json?.data?.upserted === 'number' ? json.data.upserted : null,
				skipped: typeof json?.data?.skipped === 'number' ? json.data.skipped : null,
			};
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			console.error('[Smoke Test] fetchAWINFeedIngestPreflight failed', e);
			dispatch(setUbereduxKey({ key: 'error', value: message }));
			return {
				ok: false,
				error: message || 'Failed to load AWIN products.',
			};
		}
	};