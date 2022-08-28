import {useAppDispatch, useAppSelector, useUser} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import consts from '@/lib/consts';
import {siteSlice} from '@/store/siteSlice';
import {uiSlice} from '@/store/uiSlice';
import {DatasetType, IDataset, IDatasetTag} from '@/types';
import {Close, Delete, Edit, Folder, Launch, Sort, Tag} from '@mui/icons-material';
import {
  Box, Chip, IconButton,
  List,
  ListItem, ListItemButton, ListItemText,
  ListSubheader,
  Popover,
  Stack,
  TextField, Typography,
} from '@mui/material';
import useAxios from 'axios-hooks';
import _ from 'lodash';
import * as React from 'react';
import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {DatasetTagBadge} from '../elements/DatasetTagBatch';
import {DatasetTypeBadge} from '../elements/DatasetTypeBadge';
import TagSelector from '../elements/TagSelector';

export interface IDatasetListProps {
}

interface IDataListItem {
  name: string;
  link: string;
  type: DatasetType;
  tags?: IDatasetTag[];
}

export type sortingCriteria = 'date' | 'name' | 'type' | 'tag';

interface TagFilterStatus {
  open: boolean;
  tags?: string[];
  displayText?: string;
}

const DatasetList = (props: IDatasetListProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useUser();
  const {datasetListCache, globalState, datasetListRefreshToken} = useAppSelector((state) => state.site);
  const [searchText, setSearchText] = React.useState('');

  const [tagFilterStatus, setTagFilterStatus] = React.useState<TagFilterStatus>({
    open: false,
  });


  const isManaging = globalState == 'managing';

  const [deleteDatasetAxiosResult, deleteDatasetExecute] = useAxios<any>({}, {manual: true});

  const [{data, loading, error}, refetch] = useAxios({
    ...endpoints.getDatasetList(),
  });

  useEffect(() => {
    if (!['data-listing', 'managing'].includes(globalState)) {
      dispatch(siteSlice.actions.setGlobalState('data-listing'));
    }
  });

  useEffect(() => {
    if (loading) {
      dispatch(uiSlice.actions.beginLoading('Loading datasets...'));
    } else {
      dispatch(uiSlice.actions.endLoading());
    }

    if (error) {
      dispatch(uiSlice.actions.openSnackbar({
        message: 'Error fetching dataset list.' + error && error.message || 'Unknown error.',
        severity: 'error',
      }));
    }

    if (data) {
      dispatch(siteSlice.actions.setDatasetListCache(data.results));
    } else {
      return;
    }
  }, [data, loading, error]);

  useEffect(() => {
    if (!loading && data) {
      refetch();
    }
  }, [datasetListRefreshToken]);

  const demoDatasets: IDataListItem[]= [
    // {
    //   'name': 'ADCP_202009-10',
    //   'uuid': '1',
    //   'dataset_type': 'TABLE',
    // },
    // {
    //   'name': 'CTD_201283_20201111_1520',
    //   'uuid': '2',
    //   'dataset_type': 'TABLE',
    // },
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
    // console.log('Search string:', searchStr);
    const searchHit: boolean = Boolean(searchStr.match(searchText.toLowerCase()));
    const isVisible: boolean = one.is_public || Boolean(user.username);

    let isTagFeasible = true;
    if ((tagFilterStatus.tags || []).length > 0) {
      isTagFeasible = _.intersection(tagFilterStatus.tags, one.tags.map((tag) => tag.uuid)).length > 0;
    }

    return searchHit && isVisible && isTagFeasible;
  });

  const handleDatasetEdit = (datasetId: string) => {
    navigate(`edit/${datasetId}`);
  };

  const handleDatasetDelete = (datasetId: string, datasetName: string) => {
    dispatch(uiSlice.actions.openDialog({
      type: 'confirm',
      title: 'Confirm Delete?',
      content: (<Typography variant={'body1'}>
        Are you sure to delete this dataset ({datasetName})?
      </Typography>),
      onConfirm: () => {
        deleteDatasetExecute({
          ...endpoints.deleteDataset(datasetId),
        });
      },
    }));
  };

  const handleDatasetClickedInList = (dataset: IDataset) => {
    document.dispatchEvent(new CustomEvent(consts.EVENT.MAP_FLY_TO, {
      detail: {
        lat: dataset.latitude,
        lng: dataset.longitude,
      },
    }));
  };

  React.useEffect(() => {
    const {data, loading, error} = deleteDatasetAxiosResult;
    if (!loading && data) {
      dispatch(siteSlice.actions.refreshDatasetList());
    }
  }, [deleteDatasetAxiosResult, dispatch]);

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
        {/* <DatasetTagSelector /> */}
        <Stack direction={'row'} spacing={1}>
          <Chip icon={<Sort />} label={'Sort by'}
            onDelete={() => {}}
            onClick={() => {}} />
          <Chip id={'filter-chip-tag'} icon={<Tag />} label={tagFilterStatus.displayText || 'Tag'}
            color={tagFilterStatus.displayText ? 'primary' : 'default'}
            onDelete={tagFilterStatus.displayText ? () => setTagFilterStatus({...tagFilterStatus, tags: [], displayText: null}) : null}
            onClick={() => setTagFilterStatus({...tagFilterStatus, open: !tagFilterStatus.open})}
          />
          <Chip icon={<Folder />} label={'Type'}
            onDelete={() => {}}
            onClick={() => {}} />

          <Popover anchorEl={document.getElementById('filter-chip-tag')}
            anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
            open={tagFilterStatus.open}
            onClose={() => setTagFilterStatus({...tagFilterStatus, open: false})}
          >
            <TagSelector onTagSelected={(tags: string[], displayText? : string) => {
              setTagFilterStatus({...tagFilterStatus, tags, displayText});
            }} />
          </Popover>
        </Stack>
      </Box>
      <List dense={true}
        // sx={{px: 1}}
        subheader={<ListSubheader>Datasets</ListSubheader>}
      >
        {datasetListRender.map((item, index) => {
          let secondaryAction = (<IconButton
            onClick={() => navigate(`view/${item.uuid}`)} >
            <Launch />
          </IconButton>);
          if (isManaging) {
            secondaryAction = (<Stack direction={'row'}>
              <IconButton
                disabled={deleteDatasetAxiosResult.loading}
                onClick={() => handleDatasetDelete(item.uuid, item.name)} >
                <Delete />
              </IconButton>
              <IconButton
                onClick={() => handleDatasetEdit(item.uuid)} >
                <Edit />
              </IconButton>
            </Stack>);
          }
          return (
            <ListItem key={index}
              secondaryAction={secondaryAction}
            >
              <ListItemButton disableGutters
                onClick={() => handleDatasetClickedInList(item)}
              >
                <ListItemText
                  primary={item.name}
                  secondary={
                    <Stack direction={'row'} sx={{flexWrap: 'wrap', gap: 1}}>
                      <DatasetTypeBadge type={item.dataset_type} />
                      {item.tags && item.tags.map((tag, index) => {
                        return <DatasetTagBadge key={index} tag={tag} />;
                      })}
                    </Stack>
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
