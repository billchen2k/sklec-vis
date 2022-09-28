import {IDatasetTag} from '@/types';
import {Popover} from '@mui/material';
import * as React from 'react';
import TagSelector from '../elements/TagSelector';

export interface IParentTagSelectPopoverProps {
  open: boolean;
  anchorElId: string;
  onParentTagSelected: (tag: IDatasetTag | null) => any;
  onClose: () => any;
}

export default function ParentTagSelectPopover(props: IParentTagSelectPopoverProps) {
  return (
    <Popover open={props.open}
      anchorEl={document.getElementById(props.anchorElId)}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      onClose={props.onClose}
    >
      <TagSelector
        single maxHeight={300}
        onTagSelected={(tags) => {
          props.onParentTagSelected(tags[0]);
          props.onClose();
        }}/>
    </Popover>
  );
}
