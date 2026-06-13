'use client';
import * as React from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Icon } from '../../../../NX/DesignSystem';

export default function MiniListItem({ 
    open,
        selected = false,
    options,
    onClick, 
}: { 
  open: boolean;
    selected?: boolean;
    onClick: (route?: string) => void;
  options: {
    label: string;
        icon?: string;
    route?: string;
        nested?: boolean;
  }
}) {

    const {
        icon,
        label = 'Dashboard',
        route,
        nested = false,
    } = options;

  return (
      <ListItem
          disablePadding
          sx={{ display: 'block' }}>
          <ListItemButton
              onClick={() => onClick(route)}
              sx={[
                  { minHeight: nested ? 40 : 48, px: 2.5, pl: nested ? 6 : 2.5 },
                  open ? { justifyContent: 'initial' } : { justifyContent: 'center' },
                  selected ? { bgcolor: 'action.selected' } : null,
              ]}
          >
              {icon && (
                  <ListItemIcon
                      sx={[
                          { minWidth: 0, justifyContent: 'center' },
                          open ? { mr: 3 } : { mr: 'auto' },
                      ]}
                  >
                      <Icon icon={icon as any} color={'primary'} />
                  </ListItemIcon>
              )}
              <ListItemText
                  primary={
                      <Typography
                            variant="body2"
                          color={selected ? 'text.primary' : 'text.secondary'}
                          sx={{ ml: nested ? 3 : 0 }}
                      >
                          {label}
                      </Typography>
                  }
                  sx={[
                      open ? { opacity: 1 } : { opacity: 0 },
                  ]}
              />
          </ListItemButton>
      </ListItem>
  );
}
