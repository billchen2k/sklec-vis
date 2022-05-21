import * as React from 'react';
import {DatasetType} from '@/types';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField, Typography,
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Attachment, Close, Launch} from '@mui/icons-material';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {siteSlice} from '@/store/siteSlice';
import {useEffect} from 'react';
import {DatasetTypeBadge} from '../elements/DatasetTypeBadge';

export interface IDatasetListProps {
}

interface IDataListItem {
  name: string;
  link: string;
  type: DatasetType;
}
const DatasetList = (props: IDatasetListProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {datasetListCache} = useAppSelector((state) => state.site);
  const [searchText, setSearchText] = React.useState('');

  useEffect(() => {
    dispatch(siteSlice.actions.setGlobalState('data-listing'));
  }, []);


  const demoList: IDataListItem[]= [
    {
      'name': 'ADCP_202009-10',
      'link': '/view/1',
      'type': 'TABLE',
    },
    {
      'name': 'CTD_201283_20201111_1520',
      'link': '/view/2',
      'type': 'TABLE',
    },
    // {
    //   'name': 'RDI_S3A_20200220',
    //   'link': '/view/3',
    //   'type': 'RT',
    // },
  ];

  if (datasetListCache) {
    console.log('datasetListCache', datasetListCache);
    for (const item of datasetListCache) {
      demoList.push({
        'name': item.name,
        'link': '/view/' + item.uuid,
        'type': item.dataset_type,
      });
    }
  }

  const datasetListRender = demoList.filter((one) => {
    return one.name.match(searchText);
  });

  return (
    <Box>
      <Box sx={{width: '90%', m: 2}}>
        <TextField label={'Search'} variant={'standard'} size={'small'} fullWidth={true}
          InputProps={{
            endAdornment: (
              <IconButton size={'small'} onClick={() => setSearchText('')}>
                <Close/>
              </IconButton>
            ),
          }}
          value={searchText} onChange={(e) => setSearchText(e.target.value)}
        />
      </Box>
      <List dense={true}>
        {datasetListRender.map((item, index) => {
          return (
            <ListItem key={index}
              disablePadding
              secondaryAction={<IconButton
                onClick={() => navigate(item.link)} >
                <Launch />
              </IconButton>}
            >
              <ListItemButton>
                <ListItemText
                  primary={item.name}
                  secondary={
                    <DatasetTypeBadge type={item.type} />
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {datasetListRender.length === 0 &&
          <Box sx={{textAlign: 'center'}}>
            <Typography variant={'body1'} sx={{m: 3}}><i>No dataset found.</i></Typography>
            <img style={{opacity: 0.5, filter: 'saturate(0.5)'}} src={'/android-chrome-192x192.png'}
              width={'96'} alt={'No dataset found'}/>
          </Box>
      }
    </Box>
  );
};

export default DatasetList;
