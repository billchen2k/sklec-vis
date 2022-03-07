import * as React from 'react';
import {Box, Grid} from '@mui/material';
import LineChart from '@/components/charts/LineChart';
import LayerBox from '@/layout/LayerBox';
import {useParams} from 'react-router-dom';
import {useAppDispatch} from '@/app/hooks';
import {siteSlice} from '@/store/siteSlice';

export interface IVisualizerProps {
}

const DataViewer = (props: IVisualizerProps) => {
  const texts = [...Array<number>(24).keys()].map((one: number) => <Box sx={{paddingY: '12px'}} key={one}>Content</Box>);
  const dispatch = useAppDispatch();
  const {datasetId} = useParams();
  if (parseInt(datasetId) < 3) {
    dispatch(siteSlice.actions.enterDataInspecting({
      dataId: parseInt(datasetId),
      datasetType: 'table',
    }));
  } else {
    dispatch(siteSlice.actions.enterDataInspecting({
      dataId: parseInt(datasetId),
      datasetType: 'raster',
    }));
  }

  let viewerContent = null;
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
        rasterLink: '/dataset/sentinel3/RDI_S3A_20200803_VIS.tiff',
        open: true,
      }));
      break;
  }
  return (
    <Box>
      {viewerContent}
    </Box>

  );
};

export default DataViewer;
