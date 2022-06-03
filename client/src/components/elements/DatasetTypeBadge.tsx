import {DatasetType} from '@/types';
import {Box, Typography} from '@mui/material';
import {amber, blueGrey, deepOrange, green, indigo, lightGreen, orange, yellow} from '@mui/material/colors';
import * as React from 'react';

export interface IDatasetTypeBadgeProps {
    type: DatasetType
}

export function DatasetTypeBadge(props: IDatasetTypeBadgeProps) {
  const typeColor: Record<DatasetType, string> = {
    NCF: yellow[700],
    TABLE: blueGrey[600],
    RT: lightGreen[700],
    RBR: deepOrange[700],
    GNR: '',
  };
  return <Box sx={{
    borderRadius: '3px',
    backgroundColor: typeColor[props.type] || '#555555',
    width: '2.4rem',
    textAlign: 'center',
  }}>
    <Typography variant={'caption'} sx={{
      color: '#FFFFFF',
      textAlign: 'center',
      fontWeight: 'bold',
    }}>
      {props.type}
    </Typography>
  </Box>;
}