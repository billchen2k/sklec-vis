import {useUser} from '@/app/hooks';
import {IUser} from '@/types';
import {Box, Button, Dialog, DialogActions, DialogContent, Grid, Typography} from '@mui/material';
import * as React from 'react';

export interface IDialogAccountProps {
    open: boolean;
    onClose: () => void;
}

export default function DialogAccount(props: IDialogAccountProps) {
  const user = useUser();

  if (!user) {
    return <div></div>;
  }

  return (
    <Dialog open={props.open}
      onClose={props.onClose}
      maxWidth={'xl'}
    >
      <DialogContent>
        <Typography variant={'h4'} sx={{mb: 2}}>{user?.display_name}</Typography>
        <Grid container sx={{width: '45rem'}} wrap={'wrap'} spacing={2}>
          {Object.keys(user).map((key, index) => (
            <Grid key={key} item xs={4} container justifyContent={'space-between'}>
              <Typography sx={{fontWeight: 'bold'}}>{key}:</Typography>
              <Typography>{user[key as keyof IUser]}</Typography>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button>Change Password</Button>
        <Box sx={{display: 'flex', flexGrow: 1}} />
        <Button onClick={props.onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  );
}
