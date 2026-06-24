import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    Menu,
    MenuItem,
    MobileStepper,
    Typography,
    useMediaQuery,

} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Icon } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import type { T_Product } from '../Products/components/FindProduct';
import { initProducts } from '../Products/actions/initProducts';
import { useProducts } from '../Products/hooks/useProducts';
import { useLeidaBus } from '../../hooks/useLeida';

const CARD_HEIGHT = 420;
const SWIPE_THRESHOLD_PX = 50;

const shorten = (value: string, max = 140): string => {
    if (value.length <= max) return value;
    return `${value.slice(0, max).trimEnd()}...`;
};

type AffiliatePlayerProps = {
    products?: T_Product[];
};

type T_Record = Record<string, unknown>;

const isRecord = (value: unknown): value is T_Record => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const parseJsonObject = (value: unknown): unknown => {
    if (isRecord(value) || Array.isArray(value)) return value;
    if (typeof value !== 'string') return value;

    const trimmed = value.trim();
    if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return value;

    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
};

const toText = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';

    const lowered = trimmed.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined') return '';

    return trimmed;
};

const getPathValue = (source: unknown, path: string): unknown => {
    const parts = path.split('.');
    let cursor: unknown = parseJsonObject(source);

    for (const part of parts) {
        cursor = parseJsonObject(cursor);

        if (Array.isArray(cursor)) {
            const index = Number(part);
            if (!Number.isInteger(index) || index < 0 || index >= cursor.length) return undefined;
            cursor = cursor[index];
            continue;
        }

        if (!isRecord(cursor)) return undefined;
        cursor = cursor[part];
    }

    return cursor;
};

const pickFirstText = (source: unknown, paths: string[]): string => {
    for (const path of paths) {
        const value = toText(getPathValue(source, path));
        if (value) return value;
    }
    return '';
};

const normalizeUrl = (value: string): string => {
    const raw = toText(value);
    if (!raw) return '';

    if (raw.startsWith('//')) return `https:${raw}`;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^www\./i.test(raw)) return `https://${raw}`;
    if (/^[^\s]+\.[^\s]+/.test(raw)) return `https://${raw}`;

    return raw;
};

const findNestedTextByKeys = (source: unknown, keys: string[]): string => {
    const queue: unknown[] = [parseJsonObject(source)];
    const targetKeys = new Set(keys.map((key) => key.toLowerCase()));
    const seen = new Set<unknown>();

    while (queue.length) {
        const current = queue.shift();
        if (!current || seen.has(current)) continue;
        seen.add(current);

        const parsedCurrent = parseJsonObject(current);

        if (Array.isArray(parsedCurrent)) {
            for (const item of parsedCurrent) queue.push(item);
            continue;
        }

        if (!isRecord(parsedCurrent)) continue;

        for (const [key, value] of Object.entries(parsedCurrent)) {
            const keyLower = key.toLowerCase();
            const textValue = toText(value);
            if (targetKeys.has(keyLower) && textValue) {
                return textValue;
            }

            if (isRecord(value) || Array.isArray(value) || typeof value === 'string') {
                queue.push(value);
            }
        }
    }

    return '';
};

const getTitle = (product: T_Product | undefined): string => {
    if (!product) return 'Untitled product';
    return pickFirstText(product, [
        'name',
        'title',
        'product_name',
        'data.name',
        'data.title',
        'data.product_name',
        'data.awin.product_name',
        'data.awin.product_basic.title',
        'data.awin.product_basic.name',
    ])
        || 'Untitled product';
};

const getDescription = (product: T_Product | undefined): string => {
    if (!product) return '';
    return pickFirstText(product, [
        'description',
        'data.description',
        'data.awin.description',
        'data.awin.product_basic.description',
    ]);
};

const getCategory = (product: T_Product | undefined): string => {
    if (!product) return 'Uncategorized';
    return pickFirstText(product, [
        'category',
        'category_name',
        'merchant_category',
        'data.category',
        'data.category_name',
        'data.merchant_category',
        'data.awin.category_name',
        'data.awin.product_basic.category',
    ])
        || 'Uncategorized';
};

const getImageUrl = (product: T_Product | undefined): string => {
    if (!product) return 'https://via.placeholder.com/1200x630?text=No+Image';

    const image = pickFirstText(product, [
        'image',
        'image_url',
        'merchant_image_url',
        'aw_image_url',
        'merchant_thumb_url',
        'large_image',
        'data.image',
        'data.image_url',
        'data.images.0',
        'data.aw_image_url',
        'data.merchant_image_url',
        'data.awinProduct.data.merchant_image_url',
        'data.awinProduct.data.aw_image_url',
        'data.awinProduct.product_basic.merchant_image_url',
        'data.awinProduct.product_basic.aw_image_url',
        'data.awinRow.data.merchant_image_url',
        'data.awinRow.data.aw_image_url',
        'data.awin.data.merchant_image_url',
        'data.awin.data.aw_image_url',
        'data.awin.product_basic.merchant_image_url',
        'data.awin.product_basic.aw_image_url',
    ]);

    const deepImage = image || findNestedTextByKeys(product, [
        'merchant_image_url',
        'aw_image_url',
        'image_url',
        'image',
        'thumbnail',
        'thumb_url',
    ]);

    const normalizedImage = normalizeUrl(deepImage);
    if (normalizedImage) return normalizedImage;

    return 'https://via.placeholder.com/1200x630?text=No+Image';
};

const getMerchantLink = (product: T_Product | undefined): string => {
    if (!product) return '';

    const link = pickFirstText(product, [
        'aw_deep_link',
        'merchant_deep_link',
        'deeplink',
        'deep_link',
        'url',
        'product_url',
        'data.awinDeepLink',
        'data.merchant_deep_link',
        'data.aw_deep_link',
        'data.deeplink',
        'data.deep_link',
        'data.url',
        'data.product_url',
        'data.awinProduct.merchant_deep_link',
        'data.awinProduct.aw_deep_link',
        'data.awinProduct.data.merchant_deep_link',
        'data.awinProduct.data.aw_deep_link',
        'data.awinRow.data.merchant_deep_link',
        'data.awinRow.data.aw_deep_link',
        'data.awin.merchant_deep_link',
        'data.awin.aw_deep_link',
        'data.awin.product_basic.aw_deep_link',
    ]);

    const deepLink = link || findNestedTextByKeys(product, [
        'merchant_deep_link',
        'aw_deep_link',
        'deeplink',
        'deep_link',
        'product_url',
        'url',
    ]);

    return normalizeUrl(deepLink);
};

const AffiliatePlayer: React.FC<AffiliatePlayerProps> = ({ products }) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
    const productsSlice = useProducts();
    const bus = useLeidaBus('/api/products');
    const [canSwipeByTouch, setCanSwipeByTouch] = React.useState(false);
    const [activeStep, setActiveStep] = React.useState(0);
    const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const touchStartX = React.useRef<number | null>(null);

    React.useEffect(() => {
        dispatch(initProducts());
    }, [dispatch]);

    React.useEffect(() => {
        const touchCapable =
            typeof window !== 'undefined' &&
            ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        setCanSwipeByTouch(touchCapable);
    }, []);

    const productsData = React.useMemo(() => {
        const fromProps = Array.isArray(products) ? products : [];
        const fromSlice = Array.isArray(productsSlice?.products)
            ? (productsSlice.products as T_Product[])
            : [];
        const fromBus = Array.isArray(bus?.data)
            ? (bus.data as T_Product[])
            : [];

        if (fromProps.length > 0) return fromProps;
        if (fromSlice.length > 0) return fromSlice;
        return fromBus;
    }, [products, productsSlice?.products, bus?.data]);

    const maxSteps = productsData.length;
    const enableSwipe = isPhone && canSwipeByTouch && maxSteps > 1;
    const currentProduct = productsData[activeStep];

    React.useEffect(() => {
        if (activeStep > maxSteps - 1) {
            setActiveStep(Math.max(0, maxSteps - 1));
        }
    }, [activeStep, maxSteps]);

    const handleNext = () => {
        setActiveStep((prev) => Math.min(prev + 1, maxSteps - 1));
    };

    const handleBack = () => {
        setActiveStep((prev) => Math.max(prev - 1, 0));
    };

    const handleMenuToggle = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
        if (!enableSwipe) return;
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    };

    const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
        if (!enableSwipe || touchStartX.current === null) return;

        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const deltaX = touchStartX.current - endX;
        touchStartX.current = null;

        if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
        if (deltaX > 0) handleNext();
        if (deltaX < 0) handleBack();
    };

    if (maxSteps === 0) {
        return (
            <Box
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Products
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    No products available to display.
                </Typography>
            </Box>
        );
    }

    const title = getTitle(currentProduct);
    const description = shorten(getDescription(currentProduct));
    const category = getCategory(currentProduct);
    const imageUrl = getImageUrl(currentProduct);
    const merchantLink = getMerchantLink(currentProduct);
    const isMenuOpen = Boolean(menuAnchorEl);

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >

            <Card
                variant="outlined"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                sx={{
                    height: CARD_HEIGHT,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        px: 2,
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    <Typography variant="h6">
                        {title}
                    </Typography>

                    <Button 
                        size="large" 
                        variant="contained" 
                        startIcon={<Icon icon="menu" />}
                        onClick={handleMenuToggle}>
                        Menu
                    </Button>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'stretch',
                        flexDirection: 'row',
                    }}
                >
                    <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={title}
                        sx={{
                            width: '25%',
                            height: '100%',
                            objectFit: 'cover',
                            bgcolor: 'grey.100',
                        }}
                    />

                    <CardContent
                        sx={{
                            width: '75%',
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Typography variant="body2">
                            {description || 'No description available.'}
                        </Typography>

                        <Chip label={category} size="small" sx={{ alignSelf: 'flex-start' }} />

                        <Typography variant="caption" sx={{ mt: 'auto' }}>
                            {merchantLink
                                ? 'Use the toggle to open the product menu'
                                : 'No product link available'}
                        </Typography>
                    </CardContent>
                </Box>

                <Menu
                    anchorEl={menuAnchorEl}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem disabled>
                        {merchantLink || 'No product link available'}
                    </MenuItem>
                    <MenuItem onClick={handleMenuClose}>Close</MenuItem>
                </Menu>
            </Card>

            <MobileStepper
                variant="text"
                steps={maxSteps}
                position="static"
                activeStep={activeStep}
                sx={{
                    mt: 1,
                    px: 0,
                    bgcolor: 'transparent',
                }}
                nextButton={
                    <Button variant="contained" size="large" onClick={handleNext} disabled={activeStep === maxSteps - 1}>
                        Next
                        {theme.direction === 'rtl' ? <Icon icon="left" /> : <Icon icon="right" />}
                    </Button>
                }
                backButton={
                    <Button variant="contained" size="large" onClick={handleBack} disabled={activeStep === 0}>
                        {theme.direction === 'rtl' ? <Icon icon="right" /> : <Icon icon="left" />}
                        Back
                    </Button>
                }
            />

            {/* <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {enableSwipe
                    ? 'Swipe left or right on the card'
                    : 'Use Back/Next buttons'}
            </Typography> */}
        </Box>
    );
};

export default AffiliatePlayer;
