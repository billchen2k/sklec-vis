import {useAppDispatch, useAppSelector, useUser} from '@/app/hooks';
import {DialogLogin} from '@/components/dialogs/DialogLogin';
import authSlice from '@/store/authSlice';
import {uiSlice} from '@/store/uiSlice';
import {AccountCircle, Key, Login, Logout, Person} from '@mui/icons-material';
import {Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, MenuList} from '@mui/material';
import * as React from 'react';

export interface IToolbarUserActionProps {
}

export function ToolbarUserAction(props: IToolbarUserActionProps) {
  const dispatch = useAppDispatch();
  const {isAuthorized} = useAppSelector((state) => state.auth);

  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const [loginOpen, setLoginOpen] = React.useState<boolean>(false);
  const user = useUser();
  return (
    <Box>
      <Button variant={'text'}
        id={'btn-account'}
        sx={{color: 'white', textTransform: 'none'}}
        onClick={() => setMenuOpen(true)}
        startIcon={
          <Person />
        }>
        {user?.username || 'Guest'}
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
          <MenuItem>
            <ListItemIcon>
              <Key fontSize="small" />
            </ListItemIcon>
            <ListItemText>Register</ListItemText>
          </MenuItem>
        }

        {/* Profile Action */}
        {isAuthorized &&
          <MenuItem>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Account</ListItemText>
          </MenuItem>
        }

        {/* Logout Action */}
        {isAuthorized &&
          <MenuItem onClick={() => {
            dispatch(authSlice.actions.loggedOut());
            setMenuOpen(false);
            dispatch(uiSlice.actions.openSnackbar({
              severity: 'info',
              message: 'Logged out.',
            }));
          }}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        }


      </Menu>

      <DialogLogin open={loginOpen} onClose={() => setLoginOpen(false)} />

    </Box>
  );
}
