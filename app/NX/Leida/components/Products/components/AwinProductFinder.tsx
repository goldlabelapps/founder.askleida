'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Pagination,
  PaginationItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { navigateTo } from '../../../../DesignSystem';
import { useDispatch } from '../../../../Uberedux';
import { useLeida } from '../../../hooks/useLeida';
import { fetchAwinLookfantasticCategories } from '../actions/fetchAwinLookfantasticCategories';
import { searchAwinLookfantastic } from '../actions/searchAwinLookfantastic';
import { setAwinLookfantasticSelection } from '../actions/setAwinLookfantasticSelection';

const LIMIT = 25;
const DEBOUNCE_MS = 300;

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
  const categoryFromState = typeof awinSearch?.category === 'string' ? awinSearch.category : '';
  const categories = Array.isArray(awinSearch?.categories) ? awinSearch.categories : [];
  const categoriesLoading = Boolean(awinSearch?.categoriesLoading);
  const categoriesError = typeof awinSearch?.categoriesError === 'string' ? awinSearch.categoriesError : null;
  const page = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.max(Math.ceil(count / LIMIT), 1);

  const [query, setQuery] = React.useState(queryFromState);
  const [category, setCategory] = React.useState(categoryFromState);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);

  const selectedRow = rows.find((row: Record<string, any>) => String(row?.unique_key) === selectedKey) || null;
  const showLoading = loading || categoriesLoading;

  React.useEffect(() => {
    if (!categoriesLoading && categories.length === 0) {
      dispatch(fetchAwinLookfantasticCategories());
    }
  }, [categories.length, categoriesLoading, dispatch]);

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
    setCategory(categoryFromState);
  }, [categoryFromState]);

  const runSearch = React.useCallback(async (nextOffset = 0, nextQuery = query, nextCategory = category) => {
    await dispatch(searchAwinLookfantastic({
      query: nextQuery.trim(),
      category: nextCategory.trim(),
      limit: LIMIT,
      offset: nextOffset,
    }));
  }, [category, dispatch, query]);

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

  const handleCategoryClick = async (nextCategory: string) => {
    setSelectedKey(null);
    setCategory((current: string) => (current === nextCategory ? '' : nextCategory));
  };

  const openSelectedRow = async (row: Record<string, any>) => {
    await dispatch(setAwinLookfantasticSelection(row));
    dispatch(navigateTo(router, '/products/new'));
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack component="form" onSubmit={handleSubmit} spacing={1.5}>
        {showLoading ? <LinearProgress /> : null}
        <Typography variant="h6">Find AWIN product</Typography>
        <Typography variant="body2" color="text.secondary">
          Search the 25k-record Lookfantastic feed, then click a product to open the processing screen.
        </Typography>
        <TextField
          size="small"
          fullWidth
          label="Search awin_lookfantastic"
          value={query}
          onChange={(event) => {
            setSelectedKey(null);
            setQuery(event.target.value);
          }}
          placeholder="name, SKU, category, brand, EAN"
        />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="outlined" disabled={showLoading}>
            {showLoading ? 'Searching...' : 'Search'}
          </Button>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {categoriesError ? <Alert severity="warning">{categoriesError}</Alert> : null}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label="All"
            color={!category ? 'primary' : 'default'}
            variant={!category ? 'filled' : 'outlined'}
            onClick={() => handleCategoryClick('')}
            clickable
          />
          {categoriesLoading && categories.length === 0 ? (
            <Chip label="Loading categories..." />
          ) : null}
          {categories.map((item: Record<string, any>) => {
            const categoryName = String(item?.category_name || '').trim();
            const categoryCount = Number(item?.count || 0);
            if (!categoryName) return null;
            const active = categoryName === category;
            return (
              <Chip
                key={categoryName}
                label={`${categoryName} (${categoryCount})`}
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                onClick={() => handleCategoryClick(categoryName)}
                clickable
              />
            );
          })}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${count} result${count === 1 ? '' : 's'}`} />
          <Chip size="small" label={`Page ${page} of ${totalPages}`} />
          {selectedRow ? <Chip size="small" color="primary" label="Selected" /> : null}
          {isTyping ? <Chip size="small" label="Typing..." /> : null}
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
