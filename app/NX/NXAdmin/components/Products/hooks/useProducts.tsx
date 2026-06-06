"use client";
import { useSelector } from 'react-redux';

export function useProducts() {
  const slice = useSelector((state: any) => state.redux.nxAdmin?.products);
  return slice;
}