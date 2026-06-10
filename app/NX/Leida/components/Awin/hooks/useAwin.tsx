"use client";
import { useSelector } from 'react-redux';

export function useAwin() {
  const slice = useSelector((state: any) => state.redux.leida?.awin);
  return slice;
}
