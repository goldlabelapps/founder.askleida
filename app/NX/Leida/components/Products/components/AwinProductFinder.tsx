'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { useLeida } from '../../../hooks/useLeida';
import { searchAwinLookfantastic } from '../actions/searchAwinLookfantastic';
import { setAwinLookfantasticSelection } from '../actions/setAwinLookfantasticSelection';

const LIMIT = 25;

export default function AwinProductFinder() {
  const dispatch = useDispatch();
  const router = useRouter();
  const leida = useLeida();

  const awinSearch = leida?.products?.awinSearch || {};
  const rows = Array.isArray(awinSearch?.rows) ? awinSearch.rows : [];
  const count = typeof awinSearch?.count === 'number' ? awinSearch.count : 0;
  const loading = Boolean(awinSearch?.loading);
  const error = typeof awinSearch?.error === 'string' ? awinSearch.error : null;
  const offset = typeof awinSearch?.offset === 'number' ? awinSearch.offset : 0;
  const queryFromState = typeof awinSearch?.query === 'string' ? awinSearch.query : '';

  const [query, setQuery] = React.useState(queryFromState);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  const selectedRow = rows.find((row: Record<string, any>) => String(row?.unique_key) === selectedKey) || null;

  React.useEffect(() => {
    if (rows.length > 0 && !selectedKey) {
      const firstKey = rows[0]?.unique_key;
      if (firstKey) {
        setSelectedKey(String(firstKey));
      }
    }
  }, [rows, selectedKey]);

  const runSearch = React.useCallback(async (nextOffset = 0) => {
    await dispatch(searchAwinLookfantastic({ query: query.trim(), limit: LIMIT, offset: nextOffset }));
  }, [dispatch, query]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runSearch(0);
  };

  const handleNextPage = async () => {
    const nextOffset = offset + LIMIT;
    if (nextOffset >= count) return;
    await runSearch(nextOffset);
  };

  const handlePrevPage = async () => {
    const nextOffset = Math.max(offset - LIMIT, 0);
    await runSearch(nextOffset);
  };

  const handleNext = async () => {
    if (!selectedRow) return;
    await dispatch(setAwinLookfantasticSelection(selectedRow));
    dispatch(navigateTo(router, '/products/new'));
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack component="form" onSubmit={handleSubmit} spacing={1.5}>
        <Typography variant="h6">Find AWIN product</Typography>
        <TextField
          size="small"
          fullWidth
          label="Search awin_lookfantastic"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="name, SKU, category, brand, EAN"
        />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="outlined" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!selectedRow}
          >
            NEXT
          </Button>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Typography variant="body2" color="text.secondary">
          {count} result{count === 1 ? '' : 's'}
          {count > 0 ? ` • showing ${offset + 1}-${Math.min(offset + LIMIT, count)}` : ''}
        </Typography>

        {rows.length > 0 ? (
          <Stack spacing={1}>
            {rows.map((row: Record<string, any>) => {
              const key = String(row?.unique_key || row?.id || '');
              const selected = key === selectedKey;
              return (
                <Paper
                  key={key}
                  variant="outlined"
                  onClick={() => setSelectedKey(key)}
                  sx={{
                    p: 1.25,
                    borderColor: selected ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {String(row?.product_name || 'Untitled product')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    SKU: {String(row?.merchant_product_id || '-')} • AWIN: {String(row?.aw_product_id || '-')} • {String(row?.category_name || '-')}
                  </Typography>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {row?.search_price != null ? `${String(row.search_price)} ${String(row?.currency || '')}` : 'No price'}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        ) : null}

        <Stack direction="row" spacing={1}>
          <Button variant="text" onClick={handlePrevPage} disabled={loading || offset <= 0}>
            Prev
          </Button>
          <Button variant="text" onClick={handleNextPage} disabled={loading || offset + LIMIT >= count}>
            Next
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
