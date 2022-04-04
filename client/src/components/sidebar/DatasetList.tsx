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
  TextField,
} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Attachment, Launch} from '@mui/icons-material';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {siteSlice} from '@/store/siteSlice';
import {useEffect} from 'react';

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
    {
      'name': 'RDI_S3A_20200220',
      'link': '/view/3',
      'type': 'RT',
    },
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
          value={searchText} onChange={(e) => setSearchText(e.target.value)}
        />
      </Box>
      <List dense={true}>
        {demoList.map((item, index) => {
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
                  secondary={item.type}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default DatasetList;
