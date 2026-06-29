"use client";
import { useSelector } from 'react-redux';

export function useDash() {
  const slice = useSelector((state: any) => state.redux.leida?.dash);
  return slice;
}
