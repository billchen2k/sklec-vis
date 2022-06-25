import {useAppDispatch, useAppSelector, useUser} from '@/app/hooks';
import DialogAccount from '@/components/dialogs/DialogAccount';
import {DialogLogin} from '@/components/dialogs/DialogLogin';
import DialogRegister from '@/components/dialogs/DialogRegister';
import authSlice from '@/store/authSlice';
import {uiSlice} from '@/store/uiSlice';
import {AccountCircle, Key, Login, Logout, Person} from '@mui/icons-material';
import {Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, MenuList} from '@mui/material';
import Cookies from 'js-cookie';
import * as React from 'react';

export interface IToolbarUserActionProps {
}

export function ToolbarUserAction(props: IToolbarUserActionProps) {
  const dispatch = useAppDispatch();
  const {isAuthorized} = useAppSelector((state) => state.auth);
  const user = useUser();

  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const [loginOpen, setLoginOpen] = React.useState<boolean>(false);
  const [accountOpen, setAccountOpen] = React.useState<boolean>(false);
  const [registerOpen, setRegisterOpen] = React.useState<boolean>(false);


  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(uiSlice.actions.openDialog({
      type: 'confirm',
      title: 'Confirm',
      confirmText: 'YES',
      cancelText: 'NO',
      content: `Are you sure to log out ${user?.username}?`,
      onConfirm: () => {
        dispatch(authSlice.actions.loggedOut());
        setMenuOpen(false);
        dispatch(uiSlice.actions.openSnackbar({
          severity: 'info',
          message: 'Logged out.',
        }));
      },
    }));
  };
  return (
    <Box>
      <Button variant={'text'}
        id={'btn-account'}
        sx={{color: 'white', textTransform: 'none'}}
        onClick={() => setMenuOpen(true)}
        startIcon={
          <Person />
        }>
        {user?.username || (Cookies.get('sklecvis_refresh_token') ? '...' : 'Guest')}
      </Button>
      <Menu
        open={menuOpen}
        anchorEl={document.getElementById('btn-account')}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        sx={{zIndex: 9999}}
        onClose={() => setMenuOpen(false)}
      >
        {/* Login Action */}
        {!isAuthorized &&
          <MenuItem
            onClick={() => {
              setLoginOpen(true);
              setMenuOpen(false);
            }}
          >
            <ListItemIcon>
              <Login fontSize="small" />
            </ListItemIcon>
            <ListItemText>Log In</ListItemText>
          </MenuItem>
        }

        {/* Register Action */}
        {!isAuthorized &&
          <MenuItem
            onClick={() => {
              setRegisterOpen(true);
              setMenuOpen(false);
            }}
          >
            <ListItemIcon>
              <Key fontSize="small" />
            </ListItemIcon>
            <ListItemText>Register</ListItemText>
          </MenuItem>
        }

        {/* Profile Action */}
        {isAuthorized &&
          <MenuItem
            onClick={() => {
              setAccountOpen(true);
              setMenuOpen(false);
            }}
          >
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>My Account</ListItemText>
          </MenuItem>
        }

        {/* Logout Action */}
        {isAuthorized &&
          <MenuItem onClick={() => handleLogout()}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        }


      </Menu>

      <DialogLogin open={loginOpen} onClose={() => setLoginOpen(false)} />
      <DialogAccount open={accountOpen} onClose={() => setAccountOpen(false)} />
      <DialogRegister open={registerOpen} onClose={() => setRegisterOpen(false)} />

    </Box>
  );
}
