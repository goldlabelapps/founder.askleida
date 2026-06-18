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

export const EMPTY_SUPABASE_STATE: T_SupabaseState = {
    initted: false,
    schemaLoading: false,
    schemaError: null,
    schema: null,
    activeTable: null,
    rowsByTable: {},
    authLoading: false,
    authError: null,
    authUsers: [],
    authPage: 1,
    authPerPage: 10,
    authTotal: 0,
};