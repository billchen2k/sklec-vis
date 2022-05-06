import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import LayerBox from '@/layout/LayerBox';
import {uiSlice} from '@/store/uiSlice';
import {IDataset, IVisFile} from '@/types';
import {INCFDimension} from '@/types/ncf.type';
import {valueToNode} from '@babel/types';
import {Mark} from '@mui/base';
import {Box, Typography, Stack} from '@mui/material';
import useAxios from 'axios-hooks';
import * as React from 'react';
import {useEffect} from 'react';
import RasterControl from '../charts/RasterControl';
import SKSlider from '../elements/SKSlider';
export interface INCFViewerProps {
  data: IDataset
}

interface IDimensionSliderRes {
  min: number;
  max: number;
  marks: Mark[];
  values: any[];
}

export function NCFViewer(props: INCFViewerProps) {
  const dispatch = useAppDispatch();
  const {selectedVisFile, selectedChannel} = useAppSelector((state) => state.site.inspectState);
  console.log(props.data);

  const [{data, loading, error}, execute] = useAxios(
      endpoints.getNcfContent('', ''),
      {
        manual: true,
      });

  useEffect(() => {
    if (loading) {
      dispatch(uiSlice.actions.beginLoading('Generating NCF preview data...'));
    } else {
      dispatch(uiSlice.actions.endLoading());
    }
    if (error) {
      dispatch(uiSlice.actions.openSnackbar({
        message: `Error loading NCF content: ${error.message}`,
        severity: 'error',
      }));
    }
  }, [loading, dispatch, error]);


  useEffect(() => {
    if (selectedChannel != -1 && selectedVisFile >= 0) {
      execute(
          endpoints.getNcfContent(props.data.vis_files[selectedVisFile].uuid,
              props.data.vis_files[selectedVisFile].meta_data.variables[selectedChannel].variable_name));
    }
  }, [selectedVisFile, selectedChannel]);

  let rasters: IVisFile[] = [];
  if (data && !error && !loading) {
    rasters = data.data.files.map((one: IVisFile) => {
      one.file_name = one.file_name.substring(0, 20);
      return one;
    });
  }

  const getDimensionForSlider = (label: string): IDimensionSliderRes => {
    const res: IDimensionSliderRes={min: 0, max: 1, marks: [], values: [0]};
    const dimension: INCFDimension = props.data.vis_files[selectedVisFile].meta_data.dimensions.filter((one: INCFDimension) => {
      return one.dimension_type == label;
    })[0];
    res.min = 0;
    res.max = dimension.dimension_values.length - 1;
    const middle = Math.floor(dimension.dimension_values.length / 2);
    for (const index of [0, middle, dimension.dimension_values.length - 1]) {
      res.marks.push({
        value: index,
        label: Number(dimension.dimension_values[index]).toFixed(2),
      });
    }
    res.values = dimension.dimension_values;
    return res;
  };

  const handleDimensionRangeChange = (label: string, newRange: number | number[]): void => {

  };

  return (
    <Box>
      <LayerBox key={'ncf-dimension-control'} mode={'rt'} opacity={0.95}>
        <Typography variant={'body2'}><b>Dimension Control</b></Typography>
        {selectedChannel == -1 &&
          (<Typography variant={'body1'}>Please select a data channel in the side bar to start.</Typography>)
        }
        <Box sx={{width: '30rem'}}>
          {selectedChannel >= 0 &&
          props.data.vis_files[selectedVisFile].meta_data.variables[selectedChannel].variable_dimensions.map((dim: string, index: number) => {
            const sliderConfig = getDimensionForSlider(dim);
            return (
              <Stack key={dim} direction={'row'} alignItems={'center'}>
                <Box sx={{width: '5rem', height: '50px'}}>
                  <Typography variant={'body1'} sx={{lineHeight: '50px'}}>{dim}:</Typography>
                </Box>
                {sliderConfig.max == sliderConfig.min &&
                  <Typography variant={'body1'}>{sliderConfig.min}</Typography>
                }
                {sliderConfig.max != sliderConfig.min &&
                  <Box sx={{px: 3, width: '25rem'}}>
                    <SKSlider
                      min={sliderConfig.min}
                      disabled={loading}
                      max={sliderConfig.max}
                      onChange={(e, value) => handleDimensionRangeChange(dim, value)}
                      // value={[selectedDateTimeRangeIndex[0], selectedDateTimeRangeIndex[1]]}
                      step={1}
                      valueLabelDisplay={'auto'}
                      valueLabelFormat={(value) => sliderConfig.values[value]}
                      marks={sliderConfig.marks}
                    />
                  </Box>
                }
              </Stack>
            );
          })
          }

        </Box>


      </LayerBox>
      {rasters.length > 0 &&
        <LayerBox key={'rastercontrol'} mode={'rb'} opacity={0.95}>
          <RasterControl rasterFiles={rasters} />
        </LayerBox>
      }
    </Box>
  );
}
