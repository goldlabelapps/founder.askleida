import type * as React from 'react';

import type {
    ButtonProps,
    FabProps,
    IconButtonProps,
    ListItemButtonProps,
} from '@mui/material';
import type {
    GridPaginationModel,
    GridRowSelectionModel,
    GridSortModel,
} from '@mui/x-data-grid';
import type { I_Icon } from '../NX/types';

export type T_SupabaseColumn = {
    name?: string;
    data_type?: string;
    udt_name?: string;
    nullable?: boolean;
    default?: string | null;
};

export type T_SupabaseConstraint = {
    column_name?: string;
    constraint_type?: string;
    constraint_name?: string;
};

export type T_SupabaseTable = {
    table_name?: string;
    estimated_rows?: number;
    exact_rows?: number;
    crud_allowed?: boolean;
    primary_keys?: string[];
    columns?: T_SupabaseColumn[];
    constraints?: T_SupabaseConstraint[];
};

export type T_SupabaseAuthUser = {
    id?: string;
    email?: string | null;
    role?: string | null;
    phone?: string | null;
    created_at?: string | null;
    last_sign_in_at?: string | null;
    email_confirmed_at?: string | null;
    app_metadata?: Record<string, any>;
    user_metadata?: Record<string, any>;
    identities?: Array<Record<string, any>>;
};

export type T_SupabaseSchemaData = {
    database?: {
        name?: string | null;
        user?: string | null;
        postgres_version?: string | null;
    };
    schema?: string;
    table_count?: number;
    include_exact_counts?: boolean;
    crud_allowed_tables?: string[];
    crud_allowlist_source?: 'env' | 'default';
    tables?: T_SupabaseTable[];
    auth?: {
        available?: boolean;
        user_count?: number;
        latest_signup?: string | null;
        page?: number;
        perPage?: number;
        total?: number;
        users?: T_SupabaseAuthUser[];
        error?: string;
    };
};

export type T_SupabaseRowsState = {
    loading?: boolean;
    error?: string | null;
    rows?: Record<string, any>[];
    count?: number;
    limit?: number;
    offset?: number;
    columns?: T_SupabaseColumn[];
    primaryKeys?: string[];
};

export type T_SupabaseState = {
    initted?: boolean;
    schemaLoading?: boolean;
    schemaError?: string | null;
    schema?: T_SupabaseSchemaData | null;
    activeTable?: string | null;
    rowsByTable?: Record<string, T_SupabaseRowsState>;
    authLoading?: boolean;
    authError?: string | null;
    authUsers?: T_SupabaseAuthUser[];
    authPage?: number;
    authPerPage?: number;
    authTotal?: number;
};

export const EMPTY_SUPABASE_STATE: T_SupabaseState;

export type T_AWINProductData = {
    display_price?: string | null;
    merchant_name?: string | null;
    merchant_category?: string | null;
    merchant_image_url?: string | null;
    aw_image_url?: string | null;
    brand_name?: string | null;
    [key: string]: unknown;
};

export type T_AWINProduct = {
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
    data?: T_AWINProductData | null;
    [key: string]: unknown;
};

export type T_AWINOrderBy = 'created_at' | 'id' | 'product_name' | 'category_name' | 'search_price' | 'brand';

export type T_AWINProcessDecision = 'queue' | 'delete';

export type T_AWINProcessedPayload = {
    decision: T_AWINProcessDecision;
    awin: T_AWINProduct;
};

export interface I_ListAWIN {
    products: T_AWINProduct[];
    query?: string;
    onSelect?: (product: T_AWINProduct) => void;
}

export type T_RenderAWINMode = 'card' | 'list' | 'button';

export interface I_RenderAWIN {
    awin: T_AWINProduct;
    mode?: T_RenderAWINMode;
    query?: string;
    onClick?: (product: T_AWINProduct) => void;
    buttonLabel?: string;
}

export interface I_AWINDetail {
    open: boolean;
    awin?: T_AWINProduct | null;
    onClose: () => void;
    onProcessed?: (payload: T_AWINProcessedPayload) => void | Promise<void>;
}

export type T_AWINListRow = {
    id: string;
    product_name: string;
    category_name: string;
    price: number | null;
    aw_deep_link: string;
    product: T_AWINProduct;
};

export type T_AWINListProps = {
    rows: T_AWINListRow[];
    loading: boolean;
    smokeTestLoading?: boolean;
    total: number;
    page: number;
    resultsPerPage: number;
    pageSizeOptions: number[];
    sortModel: GridSortModel;
    selectionModel: GridRowSelectionModel;
    onPaginationModelChange: (model: GridPaginationModel) => void;
    onSortModelChange: (nextModel: GridSortModel) => void;
    onRowSelectionModelChange: (nextSelection: GridRowSelectionModel) => void;
    onOpenProduct: (product: T_AWINProduct, rowId: string) => void;
    onRunSmokeTest?: () => void | Promise<void>;
};

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

export type T_Product = {
    id?: string;
    product_id?: string | number;
    name?: string;
    title?: string;
    product_name?: string;
    description?: string;
    brand?: string;
    brand_name?: string;
    category?: string;
    category_name?: string;
    merchant_category?: string;
    price?: number | string;
    search_price?: number | string;
    store_price?: number | string;
    in_stock?: boolean | string | number;
    updated?: string;
    created?: string;
    [key: string]: unknown;
};

export type MightyButtonKind = 'button' | 'icon' | 'fab' | 'listItem';

type MightyButtonBaseProps = {
    icon?: React.ReactElement | I_Icon['icon'];
    startIcon?: I_Icon['icon'];
    endIcon?: I_Icon['icon'];
    size?: 'small' | 'medium' | 'large';
    onClick?: React.MouseEventHandler<HTMLElement>;
    children?: React.ReactNode;
    alignLeft?: boolean;
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

export type T_LeidaBusEntry = {
    loading: boolean;
    error: string | null;
    data: any[];
};

export interface I_PageRouter {
    active: string | null;
}

export type DashNavItem = {
    label: string;
    icon: string;
    route: string;
    activeRoutes: string[];
    children?: DashNavItem[];
};

export type T_QueueRow = {
    id?: string | number | null;
    source?: string | null;
    source_table?: string | null;
    source_product_id?: string | null;
    decision?: string | null;
    status?: string | null;
    practitioner_id?: string | null;
    created?: string | null;
    updated?: string | null;
    [key: string]: unknown;
};

export type T_QueueListRow = {
    id: string;
    position: number;
    queueId: string;
    title: string;
    source: string | null;
    source_table: string | null;
    source_product_id: string | null;
    decision: string | null;
    status: string | null;
    practitioner_id: string | null;
    created: string | null;
    updated: string | null;
    data: Record<string, unknown>;
    row: T_QueueRow;
};

export type T_SelectedImageData = {
    thumbnailUrl: string | null;
    mainImageUrl: string | null;
    priceLabel: string | null;
    awDeepLink: string | null;
    awProductId: string | null;
    slug: string | null;
    merchantName: string | null;
    merchantDeepLink: string | null;
    description: string | null;
    descriptionPreview: string;
    displayImageUrl: string | null;
};

export type T_SelectedProps = {
    selectedRow: T_QueueListRow;
    selectedImageData: T_SelectedImageData;
    productDataDraft: Record<string, unknown>;
    deletingQueueId: string | null;
    processingQueueId: string | null;
    confirmDeleteOpen: boolean;
    onOpenDeleteConfirm: () => void;
    onSaveAndProcess: () => void;
    onConfirmDelete: () => void;
    onCloseDeleteConfirm: () => void;
};

export type T_ImageMeta = {
    status: 'idle' | 'loaded' | 'error';
    width: number;
    height: number;
};

export type AWINProcessProps = {
    awin?: T_AWINProduct | null;
    onProcessed?: (payload: { decision: T_AWINProcessDecision; awin: T_AWINProduct }) => void | Promise<void>;
};

export type T_SortBy = 'relevance' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'updated-desc';

export type T_FindProductProps = {
    products: T_Product[];
    onProductsChange?: (nextProducts: T_Product[]) => void;
    viewMode?: 'card' | 'list';
    onViewModeChange?: (nextMode: 'card' | 'list') => void;
};

export type T_RenderProductProps = {
    product: T_Product;
    onAddToCart?: (product: T_Product) => void | Promise<void>;
    addingToCart?: boolean;
    viewMode?: 'card' | 'list';
};

export type T_ListProductsProps = {
    onVisibleProductsChange?: (products: T_Product[]) => void;
    onProductSelect?: (product: T_Product) => void;
};

export type T_Record = Record<string, unknown>;

export type T_PractitionerData = {
    avatar?: string;
    display_name?: string;
    [key: string]: any;
};

export type T_PractitionerRecord = {
    practitioner_id?: string;
    title?: string;
    created?: string;
    updated?: string;
    data?: unknown;
    [key: string]: any;
};

export type T_UpdateAvatarInput = {
    practitioner_id: string;
    file: File;
};

export type T_UpdatePractitionerInput = {
    practitioner_id: string;
    key: string;
    value: unknown;
};

export type T_UpdatePractitionerProfileInput = {
    practitioner_id: string;
    email?: string;
    display_name?: string;
    clinic?: string;
    website?: string;
    access_level: number;
};

export type T_CreatePractitionerArgs = {
    email: string;
    name?: string;
};

export type T_CreatePractitionerResult = {
    email: string;
    practitionerId: string | null;
    practitioner?: Record<string, any>;
    user?: Record<string, any>;
};

export type I_DashCard = {
    title: string;
    description?: string;
    icon: string;
    cta: () => void;
};

export interface I_UserSpot {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export type T_FetchSupabaseRowsArgs = {
    table: string;
    limit?: number;
    offset?: number;
};

export type T_RowsResponse = {
    table?: string;
    rows?: Record<string, any>[];
    count?: number;
    limit?: number;
    offset?: number;
    columns?: any[];
    primary_keys?: string[];
};

export type T_FetchSupabaseAuthUsersArgs = {
    page?: number;
    perPage?: number;
};

export type T_AuthUsersResponse = {
    page?: number;
    perPage?: number;
    total?: number;
    users?: T_SupabaseAuthUser[];
};

export type T_SaveSupabaseRecordArgs =
    | {
        resource?: 'table-row';
        table: string;
        values: Record<string, any>;
        match?: Record<string, any>;
      }
    | {
        resource: 'auth-user';
        userId?: string;
        email: string;
        password?: string;
        phone?: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, any>;
        app_metadata?: Record<string, any>;
      }
    | {
        resource: 'practitioner-onboard';
        email: string;
        redirectTo?: string;
        user_metadata?: Record<string, any>;
      };

export type T_DeleteSupabaseRecordArgs =
    | {
        resource?: 'table-row';
        table: string;
        match: Record<string, any>;
      }
    | {
        resource: 'auth-user';
        userId: string;
        shouldSoftDelete?: boolean;
      };

export type T_SupabaseAuthPanelProps = {
    loading?: boolean;
    error?: string | null;
    users: T_SupabaseAuthUser[];
    total?: number;
    page?: number;
    perPage?: number;
    onRefresh: () => void;
    onPageChange: (page: number) => void;
    onSave: (args: {
        userId?: string;
        email: string;
        password?: string;
        phone?: string;
        email_confirm?: boolean;
        user_metadata?: Record<string, any>;
        app_metadata?: Record<string, any>;
    }) => Promise<void>;
    onDelete: (userId: string) => Promise<void>;
};

export type T_SupabaseAuthFormState = {
    userId?: string;
    email: string;
    phone: string;
    password: string;
    userMetadata: string;
    appMetadata: string;
    emailConfirm: boolean;
};

export type T_SupabaseRowsPanelProps = {
    table: T_SupabaseTable | null;
    rowsState: T_SupabaseRowsState | null;
    onRefresh: (tableName: string) => void;
    onCreate: (tableName: string, values: Record<string, any>) => Promise<void>;
    onUpdate: (tableName: string, match: Record<string, any>, values: Record<string, any>) => Promise<void>;
    onDelete: (tableName: string, match: Record<string, any>) => Promise<void>;
};

export type T_TableFormPreset = {
    fieldOrder?: string[];
    hiddenFields?: string[];
    labels?: Record<string, string>;
    selectOptions?: Record<string, string[]>;
};

export type T_SupabaseSchemaPanelProps = {
    schema: T_SupabaseSchemaData | null | undefined;
    activeTable: string | null | undefined;
    loading?: boolean;
    error?: string | null;
    onSelectTable: (tableName: string) => void;
    onRefresh: () => void;
};

export type T_SupabaseSettingsPanelProps = {
    schema: T_SupabaseSchemaData | null | undefined;
};

export type T_SupabaseUsersPractitionerRecord = {
    practitioner_id?: string;
    name?: string;
    title?: string;
    updated?: string;
    created?: string;
    [key: string]: any;
};
