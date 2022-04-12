import * as React from 'react';
import {Box, Button, ButtonGroup, Grid, LinearProgress, Stack, Typography} from '@mui/material';
import LineChart from '@/components/charts/LineChart';
import LayerBox from '@/layout/LayerBox';
import {useParams} from 'react-router-dom';
import {useAppDispatch} from '@/app/hooks';
import {siteSlice} from '@/store/siteSlice';
import {SkipNext, SkipPrevious} from '@mui/icons-material';
import useAxios from 'axios-hooks';
import demoData from '@/lib/demoData';
import {uiSlice} from '@/store/uiSlice';
import {useEffect} from 'react';
import {endpoints} from '@/config/endpoints';
import {IDataset} from '@/types';
import RasterControl from '@/components/charts/RasterControl';
import VisualQueryResult from '@/components/charts/VisualQueryResult';

export interface IVisualizerProps {
}

const DataViewer = (props: IVisualizerProps) => {
  const dispatch = useAppDispatch();
  const {datasetId} = useParams();
  const [{data, loading, error}] = useAxios<IDataset>(endpoints.getDatasetDetail(datasetId));
  const [rasterLinks, setRasterLinks] = React.useState<string[]>([]);
  const [currentRaster, setCurrentRaster] = React.useState(0);

  // Demo Rasters.
  // const rasters = [''];

  let viewerContent: JSX.Element | JSX.Element[] = null;


  // /// Demo Data Hooks Begin
  useEffect(() => {
    if (parseInt(datasetId) < 3) {
      dispatch(siteSlice.actions.enterDataInspecting({
        dataId: parseInt(datasetId),
        datasetType: 'TABLE',
      }));
    }
    // else if (parseInt(datasetId) == 3) {
    //   dispatch(siteSlice.actions.enterDataInspecting({
    //     dataId: parseInt(datasetId),
    //     datasetType: 'RT',
    //   }));
    //   dispatch(siteSlice.actions.setRasterState({
    //     rasterLink: `/dataset/sentinel3/${rasters[currentRaster]}`,
    //     // rasterLink: '/dataset/4dim.nc',
    //     open: true,
    //   }));
    // }
  }, [datasetId]);
  // /// Demo Data Hooks End

  useEffect(() => {
    if (loading) {
      dispatch(uiSlice.actions.beginLoading('Retrieving dataset details...'));
    } else {
      dispatch(uiSlice.actions.endLoading());
    }

    if (error && !Object.keys(demoData).includes(datasetId)) {
      dispatch(uiSlice.actions.openSnackbar({
        message: 'Error retrieving dataset details: ' + error && error.message || 'Unknown error',
        severity: 'error',
      }));
    }

    if (data) {
      dispatch(siteSlice.actions.setDatasetDetailCache(data));
      dispatch(siteSlice.actions.enterDataInspecting({
        dataId: data.uuid,
        datasetType: data.dataset_type,
      }));
    }
  }, [loading, error]);

  if (Object.keys(demoData).includes(datasetId)) {
    // Demo DATA

    switch (parseInt(datasetId)) {
      case 1:
        viewerContent = (
          <LayerBox mode={'inset'}>
            <LineChart localLink={'/dataset/ADCP_202009-10.csv'} xlabel={'DateTime'} type={'csv-local'}></LineChart>
          </LayerBox>
        );
        break;
      case 2:
        viewerContent = (
          <LayerBox mode={'inset'}>
            <LineChart localLink={'/dataset/CTD_201283_20201111_1520.csv'} xlabel={'Time'} type={'csv-local'}></LineChart>
          </LayerBox>
        );
        break;
      // case 3:
      //   viewerContent = (
      //     <LayerBox mode={'rb'}>
      //       <Stack spacing={1}>
      //         <Typography variant={'caption'}>Raster Layer Control:</Typography>
      //         <ButtonGroup>
      //           <Button disabled={currentRaster === 0} onClick={() => {
      //             dispatch(siteSlice.actions.setRasterState({
      //               rasterLink: `/dataset/sentinel3/${rasters[currentRaster - 1]}`,
      //               open: true,
      //             }));
      //             setCurrentRaster(currentRaster - 1);
      //           }}
      //           startIcon={<SkipPrevious />}>
      //         Last Frame
      //           </Button>
      //           <Button>
      //             {rasters[currentRaster]}
      //           </Button>
      //           <Button disabled={currentRaster === rasters.length - 1} onClick={() => {
      //             dispatch(siteSlice.actions.setRasterState({
      //               rasterLink: `/dataset/sentinel3/${rasters[currentRaster + 1]}`,
      //               open: true,
      //             }));
      //             setCurrentRaster(currentRaster + 1);
      //           }}
      //           startIcon={<SkipNext />}>
      //         Next Frame
      //           </Button>
      //         </ButtonGroup>
      //         <LinearProgress variant={'determinate'} value={currentRaster / rasters.length * 100}/>
      //       </Stack>
      //     </LayerBox>
      //   );
      //   break;
    }
  } else {
    // Real Data

    if (data && data['uuid'] == 'e0966e96-82d1-450b-91f1-a2680ccb4d05') {
      viewerContent = (
        <LayerBox mode={'inset'}>
          <LineChart type={'csv-local'} xlabel={'DateTime'} localLink={'/dataset/ADCP_04.csv'}></LineChart>
        </LayerBox>
      );
    } else if (data && data.dataset_type == 'RBR') {
      if (data['vis_files'].length == 0) {
        console.error('No vis file to display.');
        return null;
      }
      viewerContent = (
        <LayerBox mode={'inset'}>
          <LineChart type={'rsk'} xlabel={data['vis_files'][0]['first_dimension_name']} visfile={data['vis_files'][0].uuid}></LineChart>
        </LayerBox>
      );
    } else if (data && data.dataset_type == 'RT') {
      if (data['vis_files'].length == 0) {
        console.error('No raster file to display.');
        return null;
      }
      viewerContent = [
        <LayerBox key={'rastercontrol'} mode={'rb'} opacity={0.95}>
          <RasterControl rasterFiles={data.vis_files} />
        </LayerBox>,
        <VisualQueryResult key={'vqresult'} />,
      ];
    }
  }

  return (
    <Box>
      {viewerContent}
    </Box>

  );
};

export default DataViewer;
