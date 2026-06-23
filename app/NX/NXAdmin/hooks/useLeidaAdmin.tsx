"use client";
import { useSelector } from 'react-redux';

export function useLeidaAdmin() {
  const slice = useSelector((state: any) => state.redux.leida);
  return {
    ...slice,
  };
}

// Backward-compatible alias.
export const useNXAdmin = useLeidaAdmin;

