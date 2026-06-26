import type * as React from 'react';
import type {
    ButtonProps,
    FabProps,
    IconButtonProps,
    ListItemButtonProps,
} from '@mui/material';
import type { I_Icon } from '../NX/types';

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

export type T_AwinOrderBy = 'created_at' | 'id' | 'product_name' | 'category_name' | 'search_price' | 'brand';

export type T_AwinProcessDecision = 'queue' | 'delete';

export type T_AwinProcessedPayload = {
    decision: T_AwinProcessDecision;
    awin: T_AwinProduct;
};

export interface I_ListAwin {
    products: T_AwinProduct[];
    query?: string;
    onSelect?: (product: T_AwinProduct) => void;
}

export type T_RenderAwinMode = 'card' | 'list' | 'button';

export interface I_RenderAwin {
    awin: T_AwinProduct;
    mode?: T_RenderAwinMode;
    query?: string;
    onClick?: (product: T_AwinProduct) => void;
    buttonLabel?: string;
}

export interface I_AwinDetail {
    open: boolean;
    awin?: T_AwinProduct | null;
    onClose: () => void;
    onProcessed?: (payload: T_AwinProcessedPayload) => void | Promise<void>;
}

export type Product = {
    name?: string;
    cadence?: string;
};

export type ExampleProduct = {
    title?: string;
    data?: {
        name?: string;
        image?: string;
        category?: string;
        description?: string;
        awinRow?: {
            data?: {
                merchant_deep_link?: string;
                merchant_image_url?: string;
            };
        };
    };
};

export type RenderProductsProps = {
    products?: ExampleProduct[];
};

export type MightyButtonKind = 'button' | 'icon' | 'fab' | 'listItem';

type MightyButtonBaseProps = {
    icon?: React.ReactElement | I_Icon['icon'];
    startIcon?: I_Icon['icon'];
    endIcon?: I_Icon['icon'];
    size?: 'small' | 'medium' | 'large';
    onClick?: React.MouseEventHandler<HTMLElement>;
    children?: React.ReactNode;
};

type MightyButtonButtonProps = MightyButtonBaseProps & ButtonProps & {
    kind?: 'button';
};

type MightyButtonIconProps = MightyButtonBaseProps & IconButtonProps & {
    kind: 'icon';
};

type MightyButtonFabProps = MightyButtonBaseProps & FabProps & {
    kind: 'fab';
};

type MightyButtonListItemProps = MightyButtonBaseProps & ListItemButtonProps & {
    kind: 'listItem';
};

export type MightyButtonProps =
    | MightyButtonButtonProps
    | MightyButtonIconProps
    | MightyButtonFabProps
    | MightyButtonListItemProps;
