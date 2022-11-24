import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {endpoints} from '@/config/endpoints';
import LayerBox from '@/layout/LayerBox';
import consts from '@/lib/consts';
import {siteSlice} from '@/store/siteSlice';
import {uiSlice} from '@/store/uiSlice';
import {IDataset, IVisFile} from '@/types';
import {IDimensionType, INCFDimension} from '@/types/ncf.type';
import {Mark} from '@mui/base';
import {Check} from '@mui/icons-material';
import {Box, Typography, Stack, Button, FormControlLabel, Checkbox} from '@mui/material';
import useAxios from 'axios-hooks';
import {LatLng} from 'leaflet';
import {capitalize} from 'lodash';
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
  dateValues?: string[];
}

type RangeState = Partial<Record<IDimensionType, number[]>>;

export function NCFViewer(props: INCFViewerProps) {
  const dispatch = useAppDispatch();
  // const map = useMap();
  const {selectedVisFile, selectedChannel} = useAppSelector((state) => state.site.inspectState);
  const [ranges, setRanges] = React.useState<RangeState>({});
  const [ifFlyTo, setIfFlyTo] = React.useState<boolean>(true);

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
      console.log('error', error);
      if (error.message.includes('401')) {
        dispatch(uiSlice.actions.openSnackbar({
          message: `You need to log in to view this content.`,
          severity: 'error',
        }));
      } else {
        dispatch(uiSlice.actions.openSnackbar({
          message: `Error loading NCF content: ${error.message}`,
          severity: 'error',
        }));
      }
    }
  }, [loading, dispatch, error]);


  useEffect(() => {
    console.log(props.data);
    if (selectedChannel != -1 && selectedVisFile >= 0) {
      try {
        const defaultRange: RangeState = {};
        const visFileData = props.data.vis_files[selectedVisFile];
        const channelData = visFileData.info.variables[selectedChannel];
        channelData.variable_dimensions.forEach((dim: IDimensionType) => {
          const dimensionMeta = visFileData.info.dimensions.filter((one: any) => one.dimension_type === dim)[0];
          if (dimensionMeta.dimension_length > 1) {
            // defaultRange[dim] = [dimensionMeta.dimension_values[0], dimensionMeta.dimension_values.slice(-1)[0]];
            defaultRange[dim] = [0, dimensionMeta.dimension_length - 1];
          }
        });
        setRanges(defaultRange);
        dispatch(siteSlice.actions.setInspectingState({
          selectedRange: getValueRange(defaultRange),
        }));
        handleExecute(defaultRange);
      } catch (e) {
        console.error(e);
        dispatch(uiSlice.actions.openSnackbar({
          message: `Fail to load NCF variable. Please check console output.`,
          severity: 'error',
        }));
      }
    }
  }, [selectedVisFile, selectedChannel]);

  useEffect(() => {
    const onMapBoxSelected = (event: CustomEvent) => {
      const {latlng1, latlng2} = event.detail;
      if (latlng1 && latlng2) {
        const latValRange = [latlng1.lat, latlng2.lat];
        const lngValRange = [latlng1.lng, latlng2.lng];
        // JavaScript sort arrays alphabetically by default
        latValRange.sort((a, b) => a - b);
        lngValRange.sort((a, b) => a - b);
        const newLatLngRange: RangeState = {
          'latitude': latValRange.map((lat) => getDimensionIndex('latitude', lat)),
          'longitude': lngValRange.map((lng) => getDimensionIndex('longitude', lng)),
        };
        handleDimensionsRangeChange(newLatLngRange);
        handleExecute({...ranges, ...newLatLngRange});
      }
    };
    document.addEventListener(consts.EVENT.MAP_BOX_SELECTED, onMapBoxSelected);
    return () => {
      document.removeEventListener(consts.EVENT.MAP_BOX_SELECTED, onMapBoxSelected);
    };
  });

  let rasters: IVisFile[] = [];
  if (data && !error && !loading) {
    rasters = data.data.files.map((one: IVisFile) => {
      one.file_name = one.file_name.substring(0, 20);
      return one;
    });
  }

  const getDimensionValue = (label: string, index: number) => {
    if (selectedChannel != -1 && selectedVisFile >= 0) {
      const dimension: INCFDimension = props.data.vis_files[selectedVisFile].info.dimensions.filter((one: INCFDimension) => {
        return one.dimension_type == label;
      })[0];
      if (index > dimension.dimension_values.length - 1) {
        return 0;
      }
      return dimension.dimension_values[index];
    }
    return 0;
  };

  // Get the closest value in the dimension values
  const getDimensionIndex = (label: string, value: number): number => {
    if (selectedChannel != -1 && selectedVisFile >= 0) {
      const dimension: INCFDimension = props.data.vis_files[selectedVisFile].info.dimensions.filter((one: INCFDimension) => {
        return one.dimension_type == label;
      })[0];
      if (!dimension) {
        console.warn(`Dimension ${label} not found.`);
        return 0;
      }
      if (value < dimension.dimension_values[0]) {
        return 0;
      }
      if (value > dimension.dimension_values.slice(-1)[0]) {
        return dimension.dimension_values.length - 1;
      }
      return dimension.dimension_values.findIndex((one: number) => {
        return one >= value;
      });
    }
    return 0;
  };

  // Convert to index-based range into value-based range
  const getValueRange = (range: RangeState) : RangeState => {
    const valueRange = {};
    Object.keys(range).forEach((key) => {
      valueRange[key] = range[key].map((i) => getDimensionValue(key, i));
    });
    return valueRange;
  };


  const handleExecute = (manualRange?: RangeState) => {
    const requestRange = manualRange || ranges;
    console.log('Request Range:', requestRange);
    if (ifFlyTo && requestRange['latitude'] != undefined && requestRange['latitude'] != undefined) {
      const lat = (getDimensionValue('latitude', requestRange['latitude'][0]) +
        getDimensionValue('latitude', requestRange['latitude'][1])) / 2;
      const lng = (getDimensionValue('longitude', requestRange['longitude'][0]) +
        getDimensionValue('longitude', requestRange['longitude'][1])) / 2;
      const targetLatLng: LatLng = new LatLng(lat, lng);
      // map.flyTo(targetLatLng);
      document.dispatchEvent(new CustomEvent(consts.EVENT.MAP_FLY_TO, {
        detail: {
          latlng: targetLatLng,
          zoom: 3,
        },
      }));
    }


    const uuid = props.data.vis_files[selectedVisFile].uuid;
    const channelLabel = props.data.vis_files[selectedVisFile].info.variables[selectedChannel].variable_name;
    const guardRangeVal = (key: IDimensionType, index: number) => {
      if (requestRange[key]) {
        requestRange[key].sort((a, b) => a - b);
        return requestRange[key][index];
      }
      return undefined;
    };

    execute(
        endpoints.getNcfContent(uuid, channelLabel, {
          datetime_start: guardRangeVal('datetime', 0),
          datetime_end: guardRangeVal('datetime', 1),
          longitude_start: guardRangeVal('longitude', 0),
          longitude_end: guardRangeVal('longitude', 1),
          latitude_start: guardRangeVal('latitude', 0),
          latitude_end: guardRangeVal('latitude', 1),
          depth_start: guardRangeVal('depth', 0),
          depth_end: guardRangeVal('depth', 1),
          filenum_limit: 15,
          res_limit: 500 * 500,
        }),
    );
  };

  const getDimensionForSlider = (label: string): IDimensionSliderRes => {
    const res: IDimensionSliderRes={min: 0, max: 1, marks: [], values: [0]};
    const dimensions: INCFDimension[] = props.data.vis_files[selectedVisFile].info.dimensions.filter((one: INCFDimension) => {
      return one.dimension_type == label;
    });
    if (dimensions.length == 0) {
      dispatch(uiSlice.actions.openSnackbar({
        severity: 'error',
        message: `Failed to get information for dimension ${label}.`,
      }));
      return res;
    }
    const dimension = dimensions[0];
    res.min = 0;
    res.max = dimension.dimension_values.length - 1;
    const tickCount = 4;
    const ticks = [];
    for (let i = 0; i < tickCount - 1; i++) {
      const location = Math.floor(dimension.dimension_values.length / (tickCount - 1) * i);
      ticks.push(location);
    }
    ticks.push(dimension.dimension_length - 1);
    for (const index of ticks) {
      const tickItem = {
        value: index,
        label: Number(dimension.dimension_values[index]).toFixed(2),
      };
      if (dimension.dimension_type == 'time') {
        tickItem.label = props.data.vis_files[selectedVisFile].info.date_data[index];
        res.dateValues = props.data.vis_files[selectedVisFile].info.date_data;
      }
      res.marks.push(tickItem);
    }
    res.values = dimension.dimension_values;
    return res;
  };

  const handleDimensionRangeChange = (label: IDimensionType, newRange: number | number[]) => {
    const newRanges: RangeState = {...ranges};
    if (typeof newRange != 'object') { // If it is not an array
      newRange = [newRange, newRange];
    }
    newRanges[label] = newRange;
    console.log('new ranges:', newRanges);
    setRanges(newRanges);
    dispatch(siteSlice.actions.setInspectingState({
      selectedRange: getValueRange(newRanges),
    }));
  };

  const handleDimensionsRangeChange = (options: Partial<Record<IDimensionType, number | number[]>>) => {
    const newRanges: RangeState = {...ranges};
    Object.keys(options).forEach((label: IDimensionType) => {
      let newRange = options[label];
      if (typeof newRange != 'object') { // If it is not an array
        newRange = [newRange, newRange];
      }
      newRanges[label] = newRange;
    });
    console.log('new ranges:', newRanges);
    setRanges(newRanges);
    dispatch(siteSlice.actions.setInspectingState({
      selectedRange: getValueRange(newRanges),
    }));
  };


  return (
    <Box>
      <LayerBox key={'ncf-dimension-control'} mode={'rt'} opacity={0.95}>
        <Typography variant={'body2'}><b>Dimension Control</b></Typography>
        {selectedChannel == -1 &&
          (<Typography variant={'body1'}>Please select a data channel in the side bar to start.</Typography>)
        }

        {selectedChannel >= 0 &&
          <Box sx={{width: '30rem', position: 'relative'}}>
            <Box sx={{position: 'absolute', top: '-2rem', right: '0rem'}}>

              <FormControlLabel
                control={
                  <Checkbox size={'small'}
                    checked={ifFlyTo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIfFlyTo(e.target.checked)}
                  />} label="Locate destination" />

              <Button size={'small'} variant={'outlined'}
                disabled={loading || !ranges}
                onClick={() => handleExecute()}
                startIcon={<Check />}
              >
                Execute
              </Button>
            </Box>
            {
              props.data.vis_files[selectedVisFile].info.variables[selectedChannel].variable_dimensions.map((dim: IDimensionType, index: number) => {
                const sliderConfig = getDimensionForSlider(dim);
                const sliderRange = ranges[dim];
                const dimName = capitalize(dim);
                return (
                  <Stack key={dim} direction={'row'} alignItems={'center'}>
                    <Box sx={{width: '5rem', height: '50px'}}>
                      <Typography variant={'body1'} sx={{lineHeight: '50px'}}>{dimName}:</Typography>
                    </Box>
                    {sliderConfig.max == sliderConfig.min &&
                      <Typography variant={'body1'}>
                        {dim == 'time' ? props.data.vis_files[selectedVisFile].info.date_data[0] : sliderConfig.min}
                      </Typography>
                    }
                    {sliderConfig.max != sliderConfig.min &&
                      <Box sx={{px: 3, width: '25rem'}}>
                        <SKSlider
                          min={sliderConfig.min}
                          disabled={loading}
                          max={sliderConfig.max}
                          onChange={(e, value: number | number[]) => handleDimensionRangeChange(dim, value)}
                          value={sliderRange || 0}
                          step={1}
                          valueLabelDisplay={'auto'}
                          valueLabelFormat={(value, index) => sliderConfig.dateValues ? sliderConfig.dateValues[value] : sliderConfig.values[value]}
                          marks={sliderConfig.marks}
                        />
                      </Box>
                    }
                  </Stack>
                );
              })
            }
          </Box>
        }


      </LayerBox>

      {rasters.length > 0 &&
        <LayerBox key={'rastercontrol'} mode={'rb'} opacity={0.95}>
          <RasterControl rasterFiles={rasters} />
        </LayerBox>
      }
    </Box>
  );
}
