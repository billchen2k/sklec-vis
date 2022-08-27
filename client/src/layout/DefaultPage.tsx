import consts from '@/lib/consts';
import {Button, Stack, Typography} from '@mui/material';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';
import LayerBox from './LayerBox';

export interface IDefaultPageProps {
    type: '404' | '403';
    message?: string;
    showHome?: boolean;
}

export default function DefaultPage(props: IDefaultPageProps) {
  const navigate = useNavigate();

  return (
    <LayerBox mode={'lt'}>
      <Stack spacing={2} sx={{minWidth: 400}}>
        {props.type === '404' && <React.Fragment>
          <Typography variant={'h4'}>
            404 Not found
          </Typography>
          <Typography variant={'body1'}>
            {props.message || 'This page is not found.'}
          </Typography>
        </React.Fragment>
        }

        {props.type === '403' && <React.Fragment>
          <Typography variant={'h4'}>
            403 Forbidden
          </Typography>
          <Typography variant={'body1'}>
            {props.message || 'You don\'t have access to this page (or authentication data is still loading).'}
          </Typography>
          <Button onClick={() => {
            document.dispatchEvent(new CustomEvent(consts.EVENT.TRIGGER_LOGIN_DIALOG));
          }} variant={'outlined'}>
            Login
          </Button>
        </React.Fragment>
        }

        {props.showHome &&
          <Button onClick={() => navigate('/')} sx={{mt: 2}} variant={'outlined'}>
            Go Home
          </Button>
        }
      </Stack>

    </LayerBox>
  );
}
