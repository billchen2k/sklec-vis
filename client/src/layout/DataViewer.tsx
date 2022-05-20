import {useAppDispatch, useAppSelector} from '@/app/hooks';
import LineChart from '@/components/charts/LineChart';
import RasterControl from '@/components/charts/RasterControl';
import VisualQueryResult from '@/components/charts/VisualQueryResult';
import {NCFViewer} from '@/components/containers/NCFViewer';
import {endpoints} from '@/config/endpoints';
import LayerBox from '@/layout/LayerBox';
import demoData from '@/lib/demoData';
import {siteSlice} from '@/store/siteSlice';
import {uiSlice} from '@/store/uiSlice';
import {IDataset} from '@/types';
import {Box} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import {useEffect} from 'react';
import {useParams} from 'react-router-dom';

export interface IVisualizerProps {
}

const DataViewer = (props: IVisualizerProps) => {
  const dispatch = useAppDispatch();
  const {datasetId} = useParams();
  const [{data, loading, error}] = useAxios<IDataset>(endpoints.getDatasetDetail(datasetId));
  const {selectedVisFile, selectedChannel} = useAppSelector((state) => state.site.inspectState);


  let viewerContent: JSX.Element | JSX.Element[] = null;


  // Demo Data Hooks Begin
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
  }, [datasetId, dispatch]);

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
      console.log('Data detail:', data);
      dispatch(siteSlice.actions.setDatasetDetailCache(data));
      dispatch(siteSlice.actions.enterDataInspecting({
        dataId: data.uuid,
        datasetType: data.dataset_type,
      }));
      if (data.vis_files.length > 0) {
        dispatch(siteSlice.actions.setInspectingState({
          selectedVisFile: 0,
          selectedChannel: -1,
        }));
      }
    }
  }, [data, datasetId, dispatch, loading, error]);

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

    if (data && data['uuid'] == 'b45848e97') {
      // Local csv now demo. [todo]
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
    } else if (data && data.dataset_type == 'NCF') {
      viewerContent = [
        <NCFViewer key={'ncf-viewer'} data={data}/>,
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
