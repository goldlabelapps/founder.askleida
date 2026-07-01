'use client';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Icon, MightyButton, navigateTo, setFeedback } from '../../../../NX/DesignSystem';
import { useDispatch } from '../../../../NX/Uberedux';
import { Back, setLeida, asRecord, asText } from '../../../index';
import { slugify } from '../../../lib/slugify';

export default function ProductEdit() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const productIdQuery = React.useMemo(() => asText(searchParams?.get('productId')), [searchParams]);
  const slugQuery = React.useMemo(() => asText(searchParams?.get('slug')), [searchParams]);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [matchId, setMatchId] = React.useState('');
  const [fallbackMatchId, setFallbackMatchId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [body, setBody] = React.useState('');
  const [initialTitle, setInitialTitle] = React.useState('');
  const [initialDescription, setInitialDescription] = React.useState('');
  const [initialBody, setInitialBody] = React.useState('');
  const [baseData, setBaseData] = React.useState<Record<string, unknown>>({});
  const derivedSlug = React.useMemo(() => slugify(title), [title]);

  const isDirty = React.useMemo(
    () => title !== initialTitle || description !== initialDescription || body !== initialBody,
    [title, initialTitle, description, initialDescription, body, initialBody],
  );

  React.useEffect(() => {
    dispatch(setLeida('header', {
      title: 'Edit Product',
      icon: 'products',
    }));
  }, [dispatch]);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!productIdQuery && !slugQuery) {
        setError('Missing product identifier. Please start from Queue again.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: '200',
          sortBy: 'updated',
          sortOrder: 'desc',
        });

        const res = await fetch(`/api/products?${params.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(json?.message || `Failed to fetch product (${res.status})`);
        }

        if (cancelled) {
          return;
        }

        const rows = Array.isArray(json?.data?.rows) ? json.data.rows : [];
        const match = rows.find((row: unknown) => {
          const record = asRecord(row);
          if (!record) {
            return false;
          }

          const recordProductId = asText(record.product_id || record.id);
          const recordSlug = asText(record.slug || asRecord(record.data)?.slug);

          if (productIdQuery && recordProductId === productIdQuery) {
            return true;
          }
          if (slugQuery && recordSlug === slugQuery) {
            return true;
          }
          return false;
        }) || rows[0] || null;

        const record = asRecord(match);
        if (!record) {
          throw new Error('Product not found.');
        }

        const dataRecord = asRecord(record.data) || {};
        const primaryId = asText(record.product_id);
        const secondaryId = asText(record.id);

        setMatchId(primaryId);
        setFallbackMatchId(secondaryId || primaryId);
        const existingTitle = asText(dataRecord.title || record.title);
        const existingSlug = asText(record.slug || dataRecord.slug || slugQuery);
        const loadedTitle = existingTitle || existingSlug;
        const loadedDescription = asText(dataRecord.description);
        const loadedBody = asText(dataRecord.body);
        
        setTitle(loadedTitle);
        setDescription(loadedDescription);
        setBody(loadedBody);
        setInitialTitle(loadedTitle);
        setInitialDescription(loadedDescription);
        setInitialBody(loadedBody);
        setBaseData(dataRecord);
      } catch (e: unknown) {
        if (cancelled) {
          return;
        }
        const message = e instanceof Error ? e.message : String(e);
        setError(message || 'Failed to load product.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [productIdQuery, slugQuery]);

  const handleSave = React.useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedBody = body.trim();
    const trimmedSlug = slugify(trimmedTitle);

    const candidateIds = [matchId, fallbackMatchId].filter((value, index, self) => value && self.indexOf(value) === index);
    if (!candidateIds.length) {
      setError('Missing product ID for update.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const values = {
        ...(trimmedSlug ? { slug: trimmedSlug } : {}),
        data: {
          ...baseData,
          ...(trimmedTitle ? { title: trimmedTitle } : {}),
          description: trimmedDescription,
          body: trimmedBody,
        },
        updated: new Date().toISOString(),
      };

      let success = false;
      let lastError = '';
      for (const candidateId of candidateIds) {
        const match = candidateId === matchId
          ? { product_id: candidateId }
          : { id: candidateId };

        const res = await fetch('/api/supabase', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            resource: 'table-row',
            table: 'products',
            match,
            values,
          }),
        });

        const json = await res.json().catch(() => null);
        if (res.ok) {
          success = true;
          break;
        }

        lastError = json?.message || `Failed to save product (${res.status})`;
      }

      if (!success) {
        throw new Error(lastError || 'Failed to save product changes.');
      }

      dispatch(setFeedback({
        severity: 'success',
        title: 'Product updated.',
      }));
      dispatch(navigateTo(router, '/products'));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message || 'Failed to save product changes.');
      dispatch(setFeedback({
        severity: 'warning',
        title: message || 'Failed to save product changes.',
      }));
    } finally {
      setSaving(false);
    }
  }, [baseData, body, description, dispatch, fallbackMatchId, matchId, router, title]);

  return (
    <Stack spacing={2}>
     

      {loading ? (
        <Box sx={{ py: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">Loading product...</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}

          <Accordion variant='outlined'>
            <AccordionSummary expandIcon={<Icon icon="expand" />}>
              <Typography variant="body2">Content</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                helperText={derivedSlug ? `Slug: ${derivedSlug}` : 'Slug will be generated from title'}
                fullWidth
              />

              <TextField
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={3}
                fullWidth
              />

              <TextField
                label="Body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                multiline
                minRows={8}
                fullWidth
              />
            </AccordionDetails>
          </Accordion>

          {Object.keys(baseData).length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Current Product
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  color: 'text.secondary',
                }}
              >
                {JSON.stringify(baseData, null, 2)}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Back kind="icon" />
            <MightyButton
              variant="contained"
              onClick={() => { void handleSave(); }}
              disabled={saving || loading || !isDirty}
            >
              {saving ? 'Saving...' : 'Save'}
            </MightyButton>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
