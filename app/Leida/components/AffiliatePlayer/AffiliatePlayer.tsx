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

const toText = (value: unknown): string => {
    return typeof value === 'string' ? value.trim() : '';
};

const getTitle = (product: T_Product | undefined): string => {
    if (!product) return 'Untitled product';
    return toText(product.name)
        || toText(product.title)
        || toText(product.product_name)
        || 'Untitled product';
};

const getDescription = (product: T_Product | undefined): string => {
    if (!product) return '';
    return toText(product.description);
};

const getCategory = (product: T_Product | undefined): string => {
    if (!product) return 'Uncategorized';
    return toText(product.category)
        || toText(product.category_name)
        || toText(product.merchant_category)
        || 'Uncategorized';
};

const getImageUrl = (product: T_Product | undefined): string => {
    if (!product) return 'https://via.placeholder.com/1200x630?text=No+Image';

    const candidates = [
        product.image,
        product.image_url,
        product.merchant_image_url,
        product.aw_image_url,
        product.merchant_thumb_url,
        product.large_image,
    ];

    for (const candidate of candidates) {
        const value = toText(candidate);
        if (value) return value;
    }

    return 'https://via.placeholder.com/1200x630?text=No+Image';
};

const getMerchantLink = (product: T_Product | undefined): string => {
    if (!product) return '';

    const candidates = [
        product.aw_deep_link,
        product.merchant_deep_link,
    ];

    for (const candidate of candidates) {
        const value = toText(candidate);
        if (value) return value;
    }

    return '';
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
                        Product actions coming soon
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
