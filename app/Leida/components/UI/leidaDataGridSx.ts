import type { SxProps, Theme } from '@mui/material/styles';

export const LEIDA_DATA_GRID_SX: SxProps<Theme> = {
  border: 0,
  bgcolor: 'background.default',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: 'background.default',
    color: 'primary.main',
  },
  '& .MuiDataGrid-topContainer, & .MuiDataGrid-columnHeader, & .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller': {
    bgcolor: 'background.default',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    color: 'primary.main',
    fontWeight: 600,
  },
  '& .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton': {
    color: 'primary.main',
  },
  '& .MuiDataGrid-menuIcon': {
    visibility: 'visible',
    width: 'auto',
    opacity: 1,
  },
  '& .MuiDataGrid-menuIcon .MuiIconButton-root': {
    opacity: 1,
    color: 'primary.main',
    bgcolor: 'action.hover',
    border: '1px solid',
    borderColor: 'primary.main',
  },
  '& .MuiDataGrid-menuIcon .MuiIconButton-root:hover': {
    bgcolor: 'action.selected',
  },
  '& .MuiDataGrid-virtualScroller': {
    bgcolor: 'background.default',
  },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
    outline: 'none',
  },
  '& .MuiDataGrid-footerContainer': {
    bgcolor: 'background.default',
    justifyContent: 'center',
  },
  '& .MuiTablePagination-root': {
    mx: 'auto',
  },
  '& .MuiTablePagination-toolbar': {
    justifyContent: 'center',
    pl: 0,
  },
  '& .MuiTablePagination-spacer': {
    display: 'none',
  },
};
