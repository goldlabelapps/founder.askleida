'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  PaginationItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { navigateTo, Icon } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { useLeida } from '../../../hooks/useLeida';
import { searchAwinLookfantastic } from '../actions/searchAwinLookfantastic';
import { setAwinLookfantasticSelection } from '../actions/setAwinLookfantasticSelection';

const LIMIT = 25;
const DEBOUNCE_MS = 300;
const DEFAULT_CATEGORY = 'Skincare';

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
  const categoryFromState = typeof awinSearch?.category === 'string' ? awinSearch.category : DEFAULT_CATEGORY;
  const page = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.max(Math.ceil(count / LIMIT), 1);

  const [query, setQuery] = React.useState(queryFromState);
  const [category, setCategory] = React.useState(categoryFromState || DEFAULT_CATEGORY);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);

  const selectedRow = rows.find((row: Record<string, any>) => String(row?.unique_key) === selectedKey) || null;
  const showLoading = loading;

  React.useEffect(() => {
    if (rows.length > 0) {
      const stillVisible = rows.some((row: Record<string, any>) => String(row?.unique_key) === selectedKey);
      if (selectedKey && stillVisible) {
        return;
      }

      const firstKey = rows[0]?.unique_key;
      if (firstKey) {
        setSelectedKey(String(firstKey));
      }
    }
  }, [rows, selectedKey]);

  React.useEffect(() => {
    setQuery(queryFromState);
  }, [queryFromState]);

  React.useEffect(() => {
    setCategory(categoryFromState || DEFAULT_CATEGORY);
  }, [categoryFromState]);

  const runSearch = React.useCallback(async (nextOffset = 0, nextQuery = query, nextCategory = category) => {
    await dispatch(searchAwinLookfantastic({
      query: nextQuery.trim(),
      category: nextCategory.trim(),
      limit: LIMIT,
      offset: nextOffset,
    }));
  }, [category, dispatch, query]);

  const moveSelection = React.useCallback((direction: 1 | -1) => {
    if (rows.length === 0) {
      return;
    }

    const currentIndex = rows.findIndex((row: Record<string, any>) => String(row?.unique_key) === selectedKey);
    const baseIndex = currentIndex >= 0 ? currentIndex : direction > 0 ? -1 : 0;
    const nextIndex = Math.min(Math.max(baseIndex + direction, 0), rows.length - 1);
    const nextKey = rows[nextIndex]?.unique_key;

    if (nextKey) {
      setSelectedKey(String(nextKey));
    }
  }, [rows, selectedKey]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runSearch(0);
  };

  const handleNextPage = async () => {
    const nextPage = Math.min(page + 1, totalPages);
    await runSearch((nextPage - 1) * LIMIT);
  };

  const handlePrevPage = async () => {
    const nextPage = Math.max(page - 1, 1);
    await runSearch((nextPage - 1) * LIMIT);
  };

  const handlePaginationChange = async (_event: React.ChangeEvent<unknown>, nextPage: number) => {
    await runSearch((nextPage - 1) * LIMIT);
  };

  React.useEffect(() => {
    if (!query.trim() && !category.trim()) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const timeoutId = window.setTimeout(() => {
      void runSearch(0);
      setIsTyping(false);
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [category, query, runSearch]);

  const openSelectedRow = async (row: Record<string, any>) => {
    await dispatch(setAwinLookfantasticSelection(row));
    dispatch(navigateTo(router, '/products/new'));
  };

  const handleClearQuery = React.useCallback(() => {
    setQuery('');
    setSelectedKey(null);
    void runSearch(0, '', category);
  }, [category, runSearch]);

  const handleSearchKeyDown = async (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedRow) {
        await openSelectedRow(selectedRow);
        return;
      }

      await runSearch(0);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleClearQuery();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack component="form" onSubmit={handleSubmit} spacing={1.5}>
        {showLoading ? <LinearProgress /> : null}
        <Typography variant="h6">Find AWIN product</Typography>
        <Typography variant="body2" color="text.secondary">
          Search the 25k-record Lookfantastic feed in Skincare, then click a product to open the processing screen.
        </Typography>
        <TextField
          size="small"
          fullWidth
          label="Search awin_lookfantastic"
          value={query}
          onKeyDown={(event) => {
            void handleSearchKeyDown(event);
          }}
          onChange={(event) => {
            setSelectedKey(null);
            setQuery(event.target.value);
          }}
          placeholder="name, SKU, category, brand, EAN"
          helperText="Enter opens the selected result. Up/down moves selection. Esc clears search."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="search" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {query ? (
                    <IconButton aria-label="Clear search" edge="end" onClick={handleClearQuery} size="small">
                      <Icon icon="close" />
                    </IconButton>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {category}
                    </Typography>
                  )}
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          size="small"
          fullWidth
          label="Category"
          value={category}
          disabled
        />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="outlined" disabled={showLoading}>
            {showLoading ? 'Searching...' : 'Search'}
          </Button>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Alert severity="info" sx={{ py: 0, alignItems: 'center' }}>
            {count} result{count === 1 ? '' : 's'} in {category} · Page {page} of {totalPages}
            {selectedRow ? ' · Selected' : ''}
            {isTyping ? ' · Typing...' : ''}
          </Alert>
        </Stack>

        {selectedRow ? (
          <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: 'background.default' }}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle2">
                Selected: {String(selectedRow?.product_name || 'Untitled product')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {String(selectedRow?.category_name || '-')} • SKU {String(selectedRow?.merchant_product_id || '-')} • AWIN {String(selectedRow?.aw_product_id || '-')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedRow?.search_price != null ? `${String(selectedRow.search_price)} ${String(selectedRow?.currency || '')}` : 'No price'}
              </Typography>
            </Stack>
          </Paper>
        ) : null}

        {rows.length > 0 ? (
          <Stack spacing={1}>
            {rows.map((row: Record<string, any>) => {
              const key = String(row?.unique_key || row?.id || '');
              const selected = key === selectedKey;
              return (
                <Paper
                  key={key}
                  variant="outlined"
                  onClick={() => {
                    setSelectedKey(key);
                    void openSelectedRow(row);
                  }}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderColor: selected ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    {String(row?.product_name || 'Untitled product')}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
        ) : null}

        <Divider />

        <Stack direction="row" justifyContent="center">
          <Pagination
            color="primary"
            page={page}
            count={totalPages}
            onChange={handlePaginationChange}
            disabled={loading || count === 0}
            renderItem={(item) => (
              <PaginationItem
                {...item}
                disabled={loading || item.disabled}
              />
            )}
          />
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button variant="text" onClick={handlePrevPage} disabled={loading || page <= 1}>
            Prev
          </Button>
          <Button variant="text" onClick={handleNextPage} disabled={loading || page >= totalPages}>
            Next Page
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
