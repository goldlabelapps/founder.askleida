"use client";
import { useSelector } from 'react-redux';

export function useQueue() {
  const slice = useSelector((state: any) => state.redux.leida?.queue);
  return slice;
}