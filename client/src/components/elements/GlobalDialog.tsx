import * as React from 'react';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from '@mui/material';
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
      return (
        <Dialog open={dialog.open}
          scroll={'paper'}
          onClose={handleCancel}
        >
          <DialogTitle>{dialog.title}</DialogTitle>
          <DialogContent>
            <Typography>
              {dialog.content}

            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              dialog.onCancel && dialog.onCancel();
              handleCancel();
            }}>{dialog.cancelText || 'Cancel'}</Button>
            <Button onClick={() => {
              dialog.onConfirm && dialog.onConfirm();
              handleCancel();
            }}>{dialog.confirmText || 'Confirm'}</Button>
          </DialogActions>
        </Dialog>
      );
    default:
      return null;
  }
  return null;
};

export default GlobalDialog;
