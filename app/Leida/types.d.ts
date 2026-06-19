export type T_AwinProductData = {
    display_price?: string | null;
    merchant_name?: string | null;
    merchant_category?: string | null;
    merchant_image_url?: string | null;
    aw_image_url?: string | null;
    brand_name?: string | null;
    [key: string]: unknown;
};

export type T_AwinProduct = {
    id?: string | number | null;
    unique_key?: string | null;
    product_name?: string | null;
    description?: string | null;
    category_name?: string | null;
    search_price?: string | number | null;
    currency?: string | null;
    ean?: string | null;
    aw_product_id?: string | null;
    merchant_product_id?: string | null;
    aw_deep_link?: string | null;
    created_at?: string | null;
    data?: T_AwinProductData | null;
    [key: string]: unknown;
};
