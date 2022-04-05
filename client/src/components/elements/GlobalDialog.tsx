import * as React from 'react';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from '@mui/material';
import {uiSlice} from '@/store/uiSlice';

export interface IGlobalDialogProps {
}

const GlobalDialog = (props: IGlobalDialogProps) => {
  const {dialog} = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();
  const handleCancel = () => {
    dispatch(uiSlice.actions.dialogCancel());
  };
  switch (dialog.type) {
    case 'simple':
      return (<div>
        <Dialog open={dialog.open}
          scroll={'paper'}
          onClose={handleCancel}
          onBackdropClick={handleCancel}>
          <DialogTitle>{dialog.title}</DialogTitle>
          <DialogContent>
            {dialog.content}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel}>OK</Button>
          </DialogActions>
        </Dialog>
      </div>);
    case 'confirm':
      // todo: Confirm dialog
      return null;
    default:
      return null;
  }
  return null;
};

export default GlobalDialog;
