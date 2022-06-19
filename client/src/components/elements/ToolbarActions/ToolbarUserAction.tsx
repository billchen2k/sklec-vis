import {AccountCircle, Key, Login, Logout, Person} from '@mui/icons-material';
import {Box, Button, ListItemIcon, ListItemText, Menu, MenuItem, MenuList} from '@mui/material';
import * as React from 'react';

export interface IToolbarUserActionProps {
}

export function ToolbarUserAction(props: IToolbarUserActionProps) {
  const [open, setOpen] = React.useState<boolean>(false);
  return (
    <Box>
      <Button variant={'text'}
        id={'btn-account'}
        sx={{color: 'white', textTransform: 'none'}}
        onClick={() => setOpen(true)}
        startIcon={
          <Person />
        }>
          Guest
      </Button>
      <Menu
        open={open}
        anchorEl={document.getElementById('btn-account')}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        onClose={() => setOpen(false)}
      >
        <MenuList sx={{zIndex: 9999}}>
          <MenuItem>
            <ListItemIcon>
              <Login fontSize="small" />
            </ListItemIcon>
            <ListItemText>Log In</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <Key fontSize="small" />
            </ListItemIcon>
            <ListItemText>Register</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Account</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
