import * as React from 'react';
import {Box, Button, ButtonGroup, Grid, LinearProgress, Stack, Typography} from '@mui/material';
import LineChart from '@/components/charts/LineChart';
import LayerBox from '@/layout/LayerBox';
import {useParams} from 'react-router-dom';
import {useAppDispatch} from '@/app/hooks';
import {siteSlice} from '@/store/siteSlice';
import {SkipNext, SkipPrevious} from '@mui/icons-material';
import useAxios from 'axios-hooks';
import demoData from '@/utils/demoData';
import {uiSlice} from '@/store/uiSlice';

export interface IVisualizerProps {
}

const DataViewer = (props: IVisualizerProps) => {
  const dispatch = useAppDispatch();
  const {datasetId} = useParams();
  const [currentRaster, setCurrentRaster] = React.useState(0);
  const rasters = ['RDI_S3A_20200220_VIS.tiff', 'RDI_S3A_20200429_VIS.tiff', 'RDI_S3A_20200803_VIS.tiff', 'RDI_S3A_20200812_VIS.tiff', 'RDI_S3A_20200815_VIS.tiff', 'RDI_S3A_20200816_VIS.tiff', 'RDI_S3A_20200819_VIS.tiff', 'RDI_S3A_20200820_VIS.tiff', 'RDI_S3A_20200823_VIS.tiff', 'RDI_S3A_20200831_VIS.tiff', 'RDI_S3A_20210220_VIS.tiff', 'RDI_S3A_20210221_VIS.tiff', 'RDI_S3A_20210323_VIS.tiff', 'RDI_S3A_20210419_VIS.tiff', 'RDI_S3A_20210430_VIS.tiff', 'RDI_S3A_20210505_VIS.tiff', 'RDI_S3A_20210601_VIS.tiff', 'RDI_S3A_20210720_VIS.tiff', 'RDI_S3A_20210721_VIS.tiff', 'RDI_S3A_20210828_VIS.tiff', 'RDI_S3A_20210829_VIS.tiff', 'RDI_S3A_20210901_VIS.tiff', 'RDI_S3A_20210917_VIS.tiff', 'RDI_S3A_20210921_VIS.tiff', 'RDI_S3A_20210924_VIS.tiff', 'RDI_S3B_20200218_VIS.tiff', 'RDI_S3B_20200320_VIS.tiff', 'RDI_S3B_20200416_VIS.tiff', 'RDI_S3B_20200428_VIS.tiff', 'RDI_S3B_20200513_VIS.tiff', 'RDI_S3B_20200802_VIS.tiff', 'RDI_S3B_20200813_VIS.tiff', 'RDI_S3B_20200814_VIS.tiff', 'RDI_S3B_20200817_VIS.tiff', 'RDI_S3B_20200818_VIS.tiff', 'RDI_S3B_20200821_VIS.tiff'];

  let viewerContent = null;

  if (datasetId in Object.keys(demoData)) {
    // Demo DATA
    if (parseInt(datasetId) < 3) {
      dispatch(siteSlice.actions.enterDataInspecting({
        dataId: parseInt(datasetId),
        datasetType: 'table',
      }));
    } else if (parseInt(datasetId) == 3) {
      dispatch(siteSlice.actions.enterDataInspecting({
        dataId: parseInt(datasetId),
        datasetType: 'raster',
      }));
    }
    switch (parseInt(datasetId)) {
      case 1:
        viewerContent = (
          <LayerBox mode={'inset'}>
            <LineChart link={'/dataset/ADCP_202009-10.csv'} xlabel={'DateTime'} type={'csv'}></LineChart>
          </LayerBox>
        );
        break;
      case 2:
        viewerContent = (
          <LayerBox mode={'inset'}>
            <LineChart link={'/dataset/CTD_201283_20201111_1520.csv'} xlabel={'Time'} type={'csv'}></LineChart>
          </LayerBox>
        );
        break;
      case 3:
        dispatch(siteSlice.actions.setRasterState({
          rasterLink: `/dataset/sentinel3/${rasters[currentRaster]}`,
          // rasterLink: '/dataset/4dim.nc',
          open: true,
        }));
        viewerContent = (
          <LayerBox mode={'rb'}>
            <Stack spacing={1}>
              <Typography variant={'caption'}>Raster Layer Control:</Typography>
              <ButtonGroup>
                <Button disabled={currentRaster === 0} onClick={() => {
                  dispatch(siteSlice.actions.setRasterState({
                    rasterLink: `/dataset/sentinel3/${rasters[currentRaster - 1]}`,
                    open: true,
                  }));
                  setCurrentRaster(currentRaster - 1);
                }}
                startIcon={<SkipPrevious />}>
              Last Frame
                </Button>
                <Button>
                  {rasters[currentRaster]}
                </Button>
                <Button disabled={currentRaster === rasters.length - 1} onClick={() => {
                  dispatch(siteSlice.actions.setRasterState({
                    rasterLink: `/dataset/sentinel3/${rasters[currentRaster + 1]}`,
                    open: true,
                  }));
                  setCurrentRaster(currentRaster + 1);
                }}
                startIcon={<SkipNext />}>
              Next Frame
                </Button>
              </ButtonGroup>
              <LinearProgress variant={'determinate'} value={currentRaster / rasters.length * 100}/>
            </Stack>
          </LayerBox>
        );
        break;
    }
  } else {
    // Real Data
    const [{data, loading, error}] = useAxios(`/api/dataset/${datasetId}`);
    if (loading) {
      dispatch(uiSlice.actions.beginLoading('Retrieving dataset details...'));
      return null;
    }
    dispatch(uiSlice.actions.endLoading());
    if (error || !data) {
      dispatch(uiSlice.actions.openSnackbar({
        message: 'Error retrieving dataset details: ' + error && error.message || 'Unknown error',
        severity: 'error',
      }));
      return null;
    }

    console.log(data);
  }


  return (
    <Box>
      {viewerContent}
    </Box>

  );
};

export default DataViewer;
