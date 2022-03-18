import React from 'react';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import Snackbar from '@mui/material/Snackbar';
import {Alert, Icon, IconButton} from '@mui/material';
import config from '@/config';
import {uiSlice} from '@/store/uiSlice';

export default function GlobalSnackBar() {
  const dispatch = useAppDispatch();
  const {open, message, severity} = useAppSelector( (state) => state.ui.snackbar);

  function handleClose() {
    dispatch(uiSlice.actions.dismissSnackbar());
  }

  return (
    <Snackbar
      anchorOrigin={config.appearance.snackBarAnchorOrigin}
      open={open}
      autoHideDuration={config.appearance.snackBarAutoHideDuration}
      onClose={handleClose}
    >
      <Alert variant={'filled'} onClose={handleClose} severity={severity} sx={{width: '100%'}}>
        {message}
      </Alert>
    </Snackbar>
  );
}
