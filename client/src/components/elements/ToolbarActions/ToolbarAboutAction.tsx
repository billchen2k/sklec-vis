import {Box, Typography, Link, Button} from '@mui/material';
import * as React from 'react';
import config from '@/config';
import {useAppDispatch} from '@/app/hooks';
import {uiSlice} from '@/store/uiSlice';

export interface IToolbarAboutActionProps {
}

export default function ToolbarAboutAction(props: IToolbarAboutActionProps) {
  const dispatch = useAppDispatch();

  const aboutDialogContent = (<div>
    <div>
      <Box sx={{textAlign: 'center', ma: 2, pb: 3}}>
        <img src={'/android-chrome-192x192.png'}
          style={{opacity: 0.6, filter: 'saturate(0.8)'}}
          width={'96'} />
      </Box>
      <Typography variant={'body1'}>
                SKLEC Spatial-temporal Data Visualization System.
      </Typography>

      <Typography variant={'body1'}>
        <br /> Version: {config.version}
      </Typography>
      <Typography variant={'body1'}>Build time: {__BUILD_TIME}</Typography>
      <Typography variant={'body1'}>
        <b>East China Normal University</b> <br />
                State Key Laboratory of Estuarine and Coastal Research <br />
                School of Computer Science and Technology <br />
                2021.11 - {new Date().getFullYear()}.{new Date().getMonth() + 1}, All Rights Reserved.
      </Typography>
      <Typography variant={'body1'}>
                Contact: <Link href={'mailto:jtchen@stu.ecnu.edu.cn'}>jtchen@stu.ecnu.edu.cn</Link>
      </Typography>
    </div>
  </div>);

  return (
    <Box>
      <Button variant={'text'} sx={{color: 'white'}}
        onClick={() => {
          dispatch(uiSlice.actions.openDialog({
            type: 'simple',
            title: 'About',
            content: aboutDialogContent,
          }));
        }}>
                About
      </Button>
    </Box>

  );
}
