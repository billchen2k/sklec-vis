import {useAppDispatch} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import authSlice from '@/store/authSlice';
import {uiSlice} from '@/store/uiSlice';
import {IAuthErrorResponse, ITokenResponse} from '@/types/api';
import {AccountCircle, Key} from '@mui/icons-material';
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography} from '@mui/material';
import {Box} from '@mui/system';
import useAxios from 'axios-hooks';
import * as React from 'react';

export interface IDialogLoginProps {
    open: boolean;
    onClose: () => void;
}

export function DialogLogin(props: IDialogLoginProps) {
  const dispatch = useAppDispatch();

  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [{data, loading, error, response}, execute] = useAxios<IAuthErrorResponse & ITokenResponse>({
    ...endpoints.postLogin(username, password),
  }, {manual: true});

  React.useEffect(() => {
    if (!loading) {
      dispatch(uiSlice.actions.endLoading());
      if (!error && data) {
        dispatch(authSlice.actions.loggedIn({
          accessToken: data.access,
          refreshToken: data.refresh,
        }));
        dispatch(uiSlice.actions.openSnackbar({
          severity: 'success',
          message: `Logged in as ${username}`,
        }));
        props.onClose();
      }
    }
  }, [data, loading, error, response, dispatch]);

  const handleLogin = () => {
    dispatch(uiSlice.actions.beginLoading('Logging in...'));
    execute();
  };

  return (
    <Dialog open={props.open}>
      <DialogTitle>Log In</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{mb: 2}}>
          Welcome.
        </DialogContentText>
        <Stack spacing={1} sx={{width: '20rem'}}>
          <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
            <AccountCircle sx={{color: 'action.active', mr: 1, my: 0.5}} />
            <TextField value={username} fullWidth
              error={!loading && error}
              onChange={(e) => setUsername(e.target.value)}
              label={'Username'}
              variant={'standard'}
            />
          </Box>
          <Box sx={{display: 'flex', alignItems: 'flex-end'}}>
            <Key sx={{color: 'action.active', mr: 1, my: 0.5}} />
            <TextField value={password} fullWidth
              error={!loading && error}
              label={'Password'}
              type={'password'}
              onChange={(e) => setPassword(e.target.value)}
              variant={'standard'}
            />
          </Box>
        </Stack>

      </DialogContent>
      <DialogActions>
        {!loading && error &&
            <Typography variant={'body2'} color={'error'}>
                Incorrect username or password.
            </Typography>
        }
        <Button onClick={props.onClose}>
          Cancel
        </Button>
        <Button onClick={() => handleLogin()}
          disabled={loading}
        >
          Log In
        </Button>
      </DialogActions>
    </Dialog>
  );
}
