/**
 * Raster controller.
 */
import * as React from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemButton, ListItemText, MenuItem, Select, Slider,
  Stack,
  Typography,
} from '@mui/material';
import chroma from 'chroma-js';
import {siteSlice} from '@/store/siteSlice';
import {SkipNext, SkipPrevious} from '@mui/icons-material';
import {IVisFile} from '@/types';
import range from 'lodash/range';
import debounce from 'lodash/debounce';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {useEffect} from 'react';
import {uiSlice} from '@/store/uiSlice';
import DataMetaTable from '@/components/containers/DataMetaTable';
import {readableFileSize} from '@/lib/utils';

export interface IRasterControlProps {
  rasterFiles: IVisFile[];
  onRasterChange?: (raster: IVisFile) => any;
}

const RasterControl = (props: IRasterControlProps) => {
  const dispatch = useAppDispatch();
  const {rasterState} = useAppSelector((state) => state.site);
  const [currentRaster, setCurrentRaster] = React.useState(0);
  const [colorScale, setColorScale] = React.useState(rasterState.colorScale);
  const [resolution, setResolution] = React.useState(rasterState.resolution);
  const [opacity, setOpacity] = React.useState(rasterState.opacity);
  const [invertColorScale, setInvertColorScale] = React.useState(false);

  const colorScaleOptions = ['Spectral', 'Viridis', 'RdYlGn', 'BrBG', 'PiYG', 'PrGn', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu'];

  const rasters = props.rasterFiles.map((one) => one.file);

  const handleRasterChange = (i: number) => {
    setCurrentRaster(i);
    if (!rasterState || rasterState.rasterLink != props.rasterFiles[currentRaster].file) {
      dispatch(siteSlice.actions.setRasterState({
        rasterLink: props.rasterFiles[currentRaster].file,
        open: true,
      }));
    }
    if (props.onRasterChange) {
      props.onRasterChange(props.rasterFiles[i]);
    }
  };

  const handleRasterConfigChange = (property: string, value: any, setter: React.Dispatch<any>) => {
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    if (property == 'opacity') {
      value = Number(value).toFixed(2);
    }
    if (property == 'resolution') {
      value = Number(value).toFixed(0);
    }
    setter(value);
    debounce(() => {
      dispatch(siteSlice.actions.setRasterState({
        [property]: value,
      }));
    }, 100)();
  };

  useEffect(() => {
    handleRasterChange(0);
    const handleVisualQueryCreated = (e: any) => {
      console.log(e.detail);
      dispatch(uiSlice.actions.openSnackbar({
        message: 'Visual query created.' + e.detail.latLngs,
        severity: 'info',
      }));
      dispatch(siteSlice.actions.setRasterVisualQuery(e.detail.latLngs));
    };
    const handleVisualQueryCleared = () => {
      dispatch(siteSlice.actions.setRasterVisualQuery([]));
    };
    window.addEventListener('visual-query-cleared', handleVisualQueryCleared);
    window.addEventListener('visual-query-created', handleVisualQueryCreated);
    return () => {
      window.removeEventListener('visual-query-created', handleVisualQueryCreated);
      window.removeEventListener('visual-query-cleared', handleVisualQueryCleared);
    };
  }, []);

  const f = props.rasterFiles[currentRaster];

  const metaToShow = {...f.meta_data};
  metaToShow['Date'] = (new Date(f.datetime_start)).toISOString().split('T')[0];
  metaToShow['File Size'] = readableFileSize(f.file_size);

  const scaleColors = chroma.scale(colorScale).colors(9);
  const colorScaleColors = scaleColors.map((c) => chroma(c).css());

  return (
    <Box>
      <Stack spacing={1} sx={{maxWidth: '40rem'}}>
        <Typography variant={'body2'}><b>Raster Layer Control</b></Typography>
        <LinearProgress variant={'determinate'} value={(currentRaster + 1) / rasters.length * 100}/>
        <ButtonGroup>
          <Button disabled={currentRaster === 0} onClick={() => {
            handleRasterChange(currentRaster - 1);
          }}
          startIcon={<SkipPrevious />}>
              Last Frame
          </Button>
          <Button sx={{flexGrow: 1}}>
            {props.rasterFiles[currentRaster].file_name}
          </Button>
          <Button disabled={currentRaster === rasters.length - 1} onClick={() => {
            handleRasterChange(currentRaster + 1);
          }}
          startIcon={<SkipNext />}>
              Next Frame
          </Button>
        </ButtonGroup>

        <Grid container>
          <Grid item xs={5}>
            <List sx={{width: '100%', height: '20rem', overflowY: 'scroll'}} dense >
              {props.rasterFiles.map((one, i) => (
                <ListItemButton key={i} selected={i === currentRaster} onClick={() => {
                  handleRasterChange(i);
                }} dense>
                  <ListItemText>{i === currentRaster ? <b>{one.file_name}</b> : one.file_name}</ListItemText>
                </ListItemButton>
              ))}
            </List>
          </Grid>
          <Grid item xs={7}>
            <DataMetaTable meta={metaToShow}/>

            <Grid container maxWidth={'20rem'}>
              <Grid item xs={5} sx={{p: 1}}>
                {['Color Scale', 'Raster Opacity', 'Invert Scale', 'Resolution'].map((one, i) => {
                  return (
                    <Typography key={i} variant={'body2'} sx={{height: '2rem', lineHeight: '2rem', textAlign: 'right'}}>{one}</Typography>
                  );
                })}

              </Grid>
              <Grid item xs={7} sx={{p: 1}}>
                <Select size={'small'} value={colorScale} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange('colorScale', e.target.value, setColorScale);
                  }}>
                  {colorScaleOptions.map((one) => (
                    <MenuItem key={one} value={one}>{one}</MenuItem>
                  ))}
                </Select>
                <Select size={'small'} value={opacity} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange('opacity', e.target.value, setOpacity);
                  }}>
                  {range(0.5, 1.05, 0.05).map((one) => (
                    <MenuItem key={one} value={one.toFixed(2)}>{one.toFixed(2)}</MenuItem>
                  ))}
                </Select>
                <Select size={'small'} value={invertColorScale} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange('invertColorScale', e.target.value, setInvertColorScale);
                  }}>
                  <MenuItem value={'true'}>Yes</MenuItem>
                  <MenuItem value={'false'}>No</MenuItem>
                </Select>
                <Select size={'small'} value={resolution} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange('resolution', e.target.value, setResolution);
                  }}>
                  <MenuItem value={16}>Thumbnail (16)</MenuItem>
                  <MenuItem value={32}>Ultra Low (32)</MenuItem>
                  <MenuItem value={64}>Low (64)</MenuItem>
                  <MenuItem value={128}>Medium (128)</MenuItem>
                  <MenuItem value={256}>High (256)</MenuItem>
                  <MenuItem value={512}>Ultra High (512)</MenuItem>
                </Select>
              </Grid>
            </Grid>

          </Grid>


        </Grid>

        <Box sx={{
          background: `linear-gradient(to left, ${(invertColorScale ? colorScaleColors.reverse() : colorScaleColors).join(',')})`,
          width: '100%',
          height: '0.3rem',
        }} />
      </Stack>
    </Box>
  );
};

export default RasterControl;
