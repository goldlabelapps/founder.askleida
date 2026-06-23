'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  IconButton,
} from '@mui/material';
import { useDispatch } from '../../../../NX/Uberedux';
import { setLeidaAdmin } from '../../../NXAdmin'
import { Icon } from '../../../../NX/DesignSystem';

export default function CancelActive({ 
  collection 
}: { 
  collection: string
}) {
  void collection;

  const router = useRouter();
  const dispatch = useDispatch();

  const handleClick = () => {
    dispatch(setLeidaAdmin('active', null));
    router.push('/');
  };

  return (
    <IconButton color="primary" onClick={handleClick}>
      <Icon icon="close" />
    </IconButton>
  );
}
