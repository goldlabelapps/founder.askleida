import type { T_SupabaseState } from '../../types.d';

export type {
  T_SupabaseColumn,
  T_SupabaseConstraint,
  T_SupabaseTable,
  T_SupabaseAuthUser,
  T_SupabaseSchemaData,
  T_SupabaseRowsState,
  T_SupabaseState,
} from '../../types.d';

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
