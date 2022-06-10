import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {siteSlice} from '@/store/siteSlice';
import {DatasetType, IDataset, IDatasetTag} from '@/types';
import {Close, Launch} from '@mui/icons-material';
import {
  Box, IconButton,
  List,
  ListItem, ListItemText,
  Stack,
  TextField, Typography,
} from '@mui/material';
import * as React from 'react';
import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {DatasetTagBadge} from '../elements/DatasetTagBatch';
import {DatasetTypeBadge} from '../elements/DatasetTypeBadge';
import {DatasetTagSelector} from './DatasetTagSelector';

export interface IDatasetListProps {
}

interface IDataListItem {
  name: string;
  link: string;
  type: DatasetType;
  tags?: IDatasetTag[];
}

const DatasetList = (props: IDatasetListProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {datasetListCache} = useAppSelector((state) => state.site);
  const [searchText, setSearchText] = React.useState('');

  useEffect(() => {
    dispatch(siteSlice.actions.setGlobalState('data-listing'));
  });


  const demoDatasets: IDataListItem[]= [
    {
      'name': 'ADCP_202009-10',
      'uuid': '1',
      'dataset_type': 'TABLE',
    },
    {
      'name': 'CTD_201283_20201111_1520',
      'uuid': '2',
      'dataset_type': 'TABLE',
    },
    // {
    //   'name': 'RDI_S3A_20200220',
    //   'link': '/view/3',
    //   'type': 'RT',
    // },
  ];


  const datasetListRender: IDataset[] = (datasetListCache || []).concat(demoDatasets).filter((one: IDataset) => {
    let searchStr = one.name;
    searchStr += one.dataset_type || '';
    searchStr += one.description;
    one.tags?.forEach((tag: IDatasetTag) => {
      let parent = tag as IDatasetTag;
      while (parent) {
        searchStr += parent.name || '';
        searchStr += parent.full_name || '';
        parent = parent.parent as IDatasetTag;
      }
    });
    searchStr = searchStr.toLowerCase();
    console.log('Search string:', searchStr);
    return searchStr.match(searchText.toLowerCase());
  });

  return (
    <Box>
      <Box sx={{width: '90%', m: 2}}>
        <TextField label={'Search'} variant={'standard'} size={'small'} fullWidth={true}
          sx={{mb: 1}}
          InputProps={{
            endAdornment: (
              <IconButton size={'small'} onClick={() => setSearchText('')}>
                <Close/>
              </IconButton>
            ),
          }}
          value={searchText} onChange={(e) => setSearchText(e.target.value)}
        />
        <DatasetTagSelector />
      </Box>
      <List dense={true}>
        {datasetListRender.map((item, index) => {
          return (
            <ListItem key={index}
              secondaryAction={<IconButton
                onClick={() => navigate(`view/${item.uuid}`)} >
                <Launch />
              </IconButton>}
            >
              {/* <ListItemButton> */}
              <ListItemText
                primary={item.name}
                secondary={
                  <Stack direction={'row'} sx={{flexWrap: 'wrap', gap: 1}}>
                    <DatasetTypeBadge type={item.dataset_type} />
                    {item.tags && item.tags.map((tag, index) => {
                      return <DatasetTagBadge key={index} tag={tag} />;
                    })}
                    {/* <Box sx={{flexGrow: 1}} /> */}
                    {/* <Typography color={'text.secondary'} variant={'caption'}>
                      {item.created_at?.substring(0, 19)}
                    </Typography> */}
                  </Stack>
                }
              />
              {/* </ListItemButton> */}
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
