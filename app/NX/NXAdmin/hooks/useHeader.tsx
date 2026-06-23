"use client";
import { useSelector } from 'react-redux';

export function useHeader() {
  const header = useSelector((state: any) => state?.redux?.leida?.header);
  return typeof header !== 'undefined' ? header : undefined;
}
