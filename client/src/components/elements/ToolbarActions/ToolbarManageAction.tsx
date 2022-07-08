import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {siteSlice} from '@/store/siteSlice';
import {Add, SupervisedUserCircle, Tag} from '@mui/icons-material';
import {Box, Button, ListItemIcon, ListItemText, MenuItem, MenuList, Paper, Popper} from '@mui/material';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';

export interface IToolbarManageActionProps {
}

export default function ToolbarManageAction(props: IToolbarManageActionProps) {
  const {globalState} = useAppSelector((state) => state.site);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  //   const oldState = React.useRef<GlobalState>('data-listing');
  const isManaging = (globalState == 'managing');

  const handleToggleManage = () => {
    if (isManaging) {
      dispatch(siteSlice.actions.enterDataListing());
      navigate('/');
    } else {
      dispatch(siteSlice.actions.setGlobalState('managing'));
    }
  };

  if (!['data-listing', 'managing'].includes(globalState)) {
    return null;
  }

  return (
    <Box>
      <Button id={'btn-manage'} variant={isManaging ? 'contained' : 'text'} color={'inherit'} sx={{
        'color': isManaging ? 'black' : 'white',
      }}
      onClick={() => handleToggleManage()}>
        {globalState == 'managing' ? 'Leave Managing' : 'Manage'}
      </Button>
      <Popper
        open={isManaging}
        anchorEl={document.getElementById('btn-manage')}
        placement={'bottom'}
      >
        <Paper sx={{mt: 2}}>
          <MenuList sx={{zIndex: 9999}}>
            <MenuItem>
              <ListItemIcon>
                <Add fontSize="small" />
              </ListItemIcon>
              <ListItemText>Create Dataset</ListItemText>
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <Tag fontSize="small" />
              </ListItemIcon>
              <ListItemText>Tag Management</ListItemText>
            </MenuItem>
            <MenuItem>
              <ListItemIcon>
                <SupervisedUserCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>User Management</ListItemText>
            </MenuItem>
          </MenuList>
        </Paper>
      </Popper>
    </Box>
  );
}
