import {IDatasetTag} from '@/types';
import {TagRounded} from '@mui/icons-material';
import {Box, Typography} from '@mui/material';
import {blue} from '@mui/material/colors';
import * as React from 'react';

export interface IDatasetTypeBadgeProps {
    tag: IDatasetTag,
    displayName?: string,
}

export function DatasetTagBadge(props: IDatasetTypeBadgeProps) {
  const defaultColor = blue[800];

  let fullName = props.tag.full_name;
  let parent = props.tag.parent as IDatasetTag;
  while (parent && parent.full_name) {
    fullName = `${parent.full_name} / ${fullName}`;
    parent = parent.parent as IDatasetTag;
  }

  return <Box sx={{
    borderRadius: '3px',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: props.tag.color || defaultColor,
    textAlign: 'center',
    display: 'flex',
    width: 'fit-content',
    px: '0.2rem',
  }}>
    <TagRounded sx={{
      color: '#FFFFFF',
      width: '0.8rem',
      height: '0.8rem',
      pr: '1px',
    }}/>
    <Typography variant={'caption'} sx={{
      color: '#FFFFFF',
      textAlign: 'center',
      fontWeight: 'bold',
    }}>
      {props.displayName || fullName}
    </Typography>
  </Box>;
}
