"use client";
import { useSelector } from 'react-redux';

export function useAWIN() {
  const slice = useSelector((state: any) => state.redux.leida?.awin);
  return slice;
}
