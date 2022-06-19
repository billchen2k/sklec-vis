import {AccountCircle, Key, Login, Logout, Translate} from '@mui/icons-material';
import {Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, MenuList} from '@mui/material';
import * as React from 'react';

export interface IToolbarLanguageSelectActionProps {
}

export default function ToolbarLanguageSelectAction(props: IToolbarLanguageSelectActionProps) {
  const [open, setOpen] = React.useState<boolean>(false);
  return (
    <Box>
      <IconButton
        id={'btn-language-selector'}
        sx={{color: 'white'}}
        onClick={() => setOpen(true)}
      >
        <Translate />
      </IconButton>
      <Menu
        open={open}
        anchorEl={document.getElementById('btn-language-selector')}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        onClose={() => setOpen(false)}
      >
        <MenuList sx={{zIndex: 9999}}>
          <MenuItem>
            <ListItemText>简体中文</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemText>繁體中文</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemText>English</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
