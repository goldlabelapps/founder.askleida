'use client';
import * as React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    AppBar,
    Box,
    Button,
    Paper,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Icon, navigateTo } from '../../../NX/DesignSystem';
import { useDispatch } from '../../../NX/Uberedux';
import { setNXAdmin } from '../../../NX/NXAdmin';
import {
    useDash,
} from '../../../Leida';

const AWIN_FEED_URL = 'https://productdata.awin.com/datafeed/download/apikey/c2a684cbaabd7402c2aa0e7e6e42a1f7/language/en/fid/2082/rid/0/hasEnhancedFeeds/0/columns/aw_deep_link,product_name,aw_product_id,merchant_product_id,merchant_image_url,description,merchant_category,search_price,merchant_name,merchant_id,category_name,category_id,aw_image_url,currency,store_price,delivery_cost,merchant_deep_link,language,last_updated,display_price,data_feed_id,brand_name,brand_id,colour,product_short_description,specifications,condition,product_model,model_number,dimensions,keywords,promotional_text,product_type,commission_group,merchant_product_category_path,merchant_product_second_category,merchant_product_third_category,rrp_price,saving,savings_percent,base_price,base_price_amount,base_price_text,product_price_old,delivery_restrictions,delivery_weight,warranty,terms_of_contract,delivery_time,in_stock,stock_quantity,valid_from,valid_to,is_for_sale,web_offer,pre_order,stock_status,size_stock_status,size_stock_amount,merchant_thumb_url,large_image,alternate_image,aw_thumb_url,alternate_image_two,alternate_image_three,alternate_image_four,reviews,average_rating,rating,number_available,custom_1,custom_2,custom_3,custom_4,custom_5,custom_6,custom_7,custom_8,custom_9,ean,isbn,upc,mpn,parent_product_id,product_GTIN,basket_link,Fashion%3Asuitable_for,Fashion%3Acategory,Fashion%3Asize,Fashion%3Amaterial,Fashion%3Apattern,Fashion%3Aswatch/format/csv/delimiter/%2C/compression/gzip/adultcontent/1/';

export default function Awin() {
    const dispatch = useDispatch();
    const router = useRouter();
    const dash = useDash();
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        if (dash && dash.title) {
            dispatch(setNXAdmin('header', {
                title: 'Awin',
                icon: 'awin',
            }));
        }
    }, [dispatch, dash?.title]);

    const handleGoToSearch = React.useCallback(() => {
        dispatch(navigateTo(router, '/awin/search'));
    }, [dispatch, router]);

    const handleCopyUrl = React.useCallback(async () => {
        await navigator.clipboard.writeText(AWIN_FEED_URL);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    }, []);

    return (
        <Box sx={{ p: 2 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                    Searching Lookfantastic Products
                </Typography>
                    <Typography variant="body1" sx={{mb:2}}>
                        Our plan was to query the Awin API for Lookfantastic products 
                        at this point, but it turns out that's not possible, so we will 
                        have to do a cron job to check the feed url for changes. When it 
                        changes, we pull the latest feed and update products which have changed
                    </Typography>

                    <Accordion variant="outlined">
                        <AccordionSummary expandIcon={<Icon icon="down" color="primary" />}>
                            <Typography>Product Feed</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
                                    <Button
                                        variant="outlined"
                                        href={AWIN_FEED_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        startIcon={<Icon icon="download" />}
                                    >
                                        Download CSV
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCopyUrl}
                                        startIcon={<Icon icon="link" />}
                                    >
                                        {copied ? 'Copied URL' : 'Copy URL to Clipboard'}
                                    </Button>
                                </Stack>
                                <Box sx={{
                                    p: 1.5,
                                    backgroundColor: 'background.default',
                                    borderRadius: 1,
                                    wordBreak: 'break-all',
                                    fontSize: 'small',
                                }}>
                                    <pre>
                                        {AWIN_FEED_URL}
                                    </pre>
                                </Box>
                                
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
            </Paper>
        </Box>
    );
}