import {useAppDispatch, useAppSelector} from '@/app/hooks';
import DataDetails from '@/components/sidebar/DataDetails';
import DatasetList from '@/components/sidebar/DatasetList';
import demoData from '@/lib/demoData';
import {siteSlice} from '@/store/siteSlice';
import {INCFVariable} from '@/types/ncf.type';
import {ArrowBack} from '@mui/icons-material';
import {Box, Card, FormControl, IconButton, InputLabel, List, ListItemButton, ListItemText, MenuItem, Select, SelectChangeEvent, Stack, SxProps, Tooltip, Typography} from '@mui/material';
import * as React from 'react';
import {useNavigate} from 'react-router-dom';

export interface ISidebarProps {
  sx?: SxProps;
}

const Sidebar = (props: ISidebarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {globalState, currentData, currentType, rasterState, datasetDetailCache} = useAppSelector((state) => state.site);
  const {selectedVisFile, selectedChannel} = useAppSelector((state) => state.site.inspectState);
  const handleNavigateBack = () => {
    dispatch(siteSlice.actions.enterDataListing());
    navigate('/');
  };

  const handleChangeSelectedVisFile = (e: SelectChangeEvent<number>) => {
    dispatch(siteSlice.actions.setInspectingState({
      selectedVisFile: e.target.value,
    }));
  };

  const handleChangeSelectedChannel = (e: React.MouseEvent, index: number) => {
    dispatch(siteSlice.actions.setInspectingState({
      selectedChannel: index,
    }));
  };

  let sidebarContent = null;
  let detailContent = null;
  let channelSelectContent = null;

  if (datasetDetailCache && datasetDetailCache.dataset_type == 'NCF') {
    const channels: INCFVariable[] = datasetDetailCache.vis_files[selectedVisFile]?.meta_data?.variables || [];
    channelSelectContent = (<Box sx={{mt: 1}}>
      <Typography variant={'body2'} sx={{pb: 1}}>Data Channels:</Typography>
      <Card variant={'outlined'}>
        <List sx={{width: '100%'}} dense>
          {channels.map((one, index) => {
            return (
              <ListItemButton key={index}
                selected={index == selectedChannel}
                onClick={(e) => handleChangeSelectedChannel(e, index)}
              >
                <ListItemText
                  primary={
                    <Tooltip title={one.variable_longname}>
                      {index == selectedChannel ?
                          <b>{one.variable_name} ({one.variable_units})</b> :
                          <div>{one.variable_name} ({one.variable_units})</div>
                      }
                    </Tooltip>
                  }
                  // secondary={`Unit: ${one.variable_units}; Full name: ${one.variable_longname}`}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Card>
    </Box>
    );
  }

  switch (globalState) {
    case 'data-listing':
    case 'managing':
      sidebarContent = (
        <DatasetList />
      );
      break;
    case 'data-inspecting':
      if (Object.keys(demoData).includes(String(currentData))) {
        // DEMO DATA
        detailContent = (
          <DataDetails
            meta={demoData[currentData as string]['meta']}
            datasetName={demoData[currentData as string]['name']}
            downloadLink={demoData[currentData as string]['downloadLink']}
          />
        );
        sidebarContent = (
          <Box sx={{p: 2}}>
            <Stack sx={{mb: 1}} spacing={'1'} direction={'row'} alignItems={'center'}>
              <IconButton onClick={handleNavigateBack}>
                <ArrowBack />
              </IconButton>
              <Typography variant={'h5'}>(DEMO DATA)</Typography>
            </Stack>
            {detailContent}
          </Box>
        );
      } else if (datasetDetailCache) {
        // Real data
        detailContent = (
          <DataDetails
            meta={datasetDetailCache['meta_data']}
            datasetName={datasetDetailCache['name']}
            description={datasetDetailCache['description']}
            downloadLink={datasetDetailCache['raw_files'].length > 0 ? datasetDetailCache['raw_files'][0]['file'] : null}
          />
        );
        sidebarContent = (
          <Box sx={{p: 2}}>
            <Stack sx={{mb: 1}} spacing={'1'} direction={'row'} alignItems={'center'}>
              <IconButton onClick={handleNavigateBack}>
                <ArrowBack />
              </IconButton>
              <Typography variant={'h5'}>{datasetDetailCache?.name.substring(0, 20) || 'Loading...'}</Typography>
            </Stack>
            <FormControl variant={'standard'} size={'small'} fullWidth>
              <InputLabel>File to preview:</InputLabel>
              <Select value={selectedVisFile || 0}
                onChange={handleChangeSelectedVisFile}
              >
                {datasetDetailCache.vis_files.map((one, index) => {
                  return (<MenuItem key={index} value={index}>
                    {one.file_name}
                  </MenuItem>);
                })}
              </Select>
            </FormControl>
            {channelSelectContent}
            {detailContent}

          </Box>
        );
      }
      break;
  }

  return (
    <Box sx={props.sx} id={'container-sidebar'}>
      {sidebarContent}
      <Box sx={{height: '4rem'}}></Box>
    </Box>
  );
};

export default Sidebar;
