import {InfoOutlined} from '@mui/icons-material';
import {Stack, Tooltip, Typography} from '@mui/material';
import * as React from 'react';

export interface IFormItemLabelProps {
    label: string;
    tooltip?: string
}

export default function FormItemLabel(props: IFormItemLabelProps) {
  if (props.tooltip) {
    return <Tooltip title={
      <Typography variant={'body2'}>{props.tooltip}</Typography>
    }>
      <Stack direction={'row'} alignItems={'center'} sx={{mt: 1}}>
        <Typography variant={'body1'}>{props.label}</Typography>
        <InfoOutlined sx={{width: 16, height: 16, ml: 1}} />
      </Stack>
    </Tooltip>;
  } else {
    return <Typography variant={'body1'} sx={{mt: 1}}>{props.label}</Typography>;
  }
};
