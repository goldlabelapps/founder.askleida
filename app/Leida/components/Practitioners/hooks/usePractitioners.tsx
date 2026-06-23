"use client";
import { useSelector } from 'react-redux';

export function usePractitioners() {
  const slice = useSelector((state: any) => state.redux.nxAdmin?.practitioners);
  return slice;
}
