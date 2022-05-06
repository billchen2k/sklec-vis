/**
 * Raster controller.
 */
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import DataMetaTable from '@/components/containers/DataMetaTable';
import {readableFileSize} from '@/lib/utils';
import {IRasterState, siteSlice} from '@/store/siteSlice';
import {IVisFile} from '@/types';
import {PlayArrow, RotateLeft, SkipNext, SkipPrevious} from '@mui/icons-material';
import {
  Box,
  Button,
  ButtonGroup,
  Grid, IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack, TextField,
  Typography,
} from '@mui/material';
import chroma from 'chroma-js';
import debounce from 'lodash/debounce';
import range from 'lodash/range';
import * as React from 'react';
import {useEffect} from 'react';

export interface IRasterControlProps {
  rasterFiles: IVisFile[]; // only file field will be used
  onRasterChange?: (raster: IVisFile) => any;
}

const RasterControl = (props: IRasterControlProps) => {
  const dispatch = useAppDispatch();
  const {rasterState} = useAppSelector((state) => state.site);
  const [currentRaster, setCurrentRaster] = React.useState(0);
  const [rasterConfig, setRasterConfig] = React.useState(rasterState.config);

  const colorScaleOptions = ['Spectral', 'Viridis', 'RdYlGn', 'BrBG', 'PiYG', 'PrGn', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu'];

  const rasters = props.rasterFiles.map((one) => one.file);

  const handleRasterChange = (i: number) => {
    if (rasterState.rasterLink != rasters[i]) {
      dispatch(siteSlice.actions.setRasterState({
        rasterLink: rasters[i],
        open: true,
      }));
    }
    setCurrentRaster(i);
    if (props.onRasterChange) {
      props.onRasterChange(props.rasterFiles[i]);
    }
  };

  const debouncedRasterConfigDispatch = React.useRef(debounce((properties: Partial<IRasterState['config']>): any => {
    dispatch(siteSlice.actions.setRasterStateConfig({
      ...properties,
    }));
  }, 200)).current;

  const handleRasterConfigChange = (properties: any) => {
    Object.keys(properties).forEach((property) => {
      const value = properties[property];
      if (value === 'true') {
        properties[property] = true;
      } else if (value === 'false') {
        properties[property] = false;
      }
      if (property == 'opacity') {
        properties[property] = Number(value).toFixed(2);
      }
      if (property == 'resolution') {
        properties[property] = Number(value).toFixed(0);
      }
      if (property == 'rasterMin' || property == 'rasterMax') {
        properties[property] = Number(value);
      }
    });
    const newConfig = {...rasterConfig, ...properties};
    debouncedRasterConfigDispatch(properties);
    setRasterConfig(newConfig);
    ;
  };

  useEffect(() => {
    handleRasterChange(0);
    const handleVisualQueryCreated = (e: any) => {
      console.log(e.detail);
      dispatch(siteSlice.actions.setRasterVisualQuery(e.detail.latLngs));
    };
    const handleVisualQueryCleared = () => {
      dispatch(siteSlice.actions.setRasterVisualQuery([]));
    };
    // window.addEventListener('visual-query-cleared', handleVisualQueryCleared);
    window.addEventListener('visual-query-created', handleVisualQueryCreated);
    return () => {
      window.removeEventListener('visual-query-created', handleVisualQueryCreated);
      window.removeEventListener('visual-query-cleared', handleVisualQueryCleared);
      debouncedRasterConfigDispatch.cancel();
    };
  }, []);

  const f = props.rasterFiles[currentRaster];

  const metaToShow = {...(f.meta_data || {})};
  if (f.datetime_start) {
    metaToShow['Date'] = (new Date(f.datetime_start)).toISOString().split('T')[0];
  }
  if (f.file_size) {
    metaToShow['File Size'] = readableFileSize(f.file_size);
  }


  const scaleColors = chroma.scale(rasterConfig.colorScale).colors(9);
  const colorScaleColors = scaleColors.map((c) => chroma(c).css());

  // @ts-ignore
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
          <Button>
            <PlayArrow />
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

            <Grid container maxWidth={'24rem'}>
              <Grid item xs={5} sx={{p: 1}}>
                {['Color Scale', 'Raster Opacity', 'Invert Scale', 'Resolution', 'Value Range'].map((one, i) => {
                  return (
                    <Typography key={i} variant={'body2'} sx={{height: '2rem', lineHeight: '2rem', textAlign: 'right'}}>
                      {one === 'Value Range' && <IconButton onClick={() => {
                        handleRasterConfigChange({
                          rasterMin: 0.08,
                          rasterMax: 0.15,
                        });
                        // handleRasterConfigChange('rasterMax', '0.15');
                      }} size={'small'}>
                        <RotateLeft/>
                      </IconButton>}
                      {one}
                    </Typography>
                  );
                })}

              </Grid>
              <Grid item xs={7} sx={{p: 1}}>
                <Select size={'small'} value={rasterConfig.colorScale} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange({colorScale: e.target.value});
                  }}>
                  {colorScaleOptions.map((one) => (
                    <MenuItem key={one} value={one}>{one}</MenuItem>
                  ))}
                </Select>
                <Select size={'small'} value={rasterConfig.opacity} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange({opacity: e.target.value});
                  }}>
                  {range(0.5, 1.05, 0.05).map((one) => (
                    <MenuItem key={one} value={one.toFixed(2)}>{one.toFixed(2)}</MenuItem>
                  ))}
                </Select>
                <Select size={'small'} value={rasterConfig.invertColorScale} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange({invertColorScale: e.target.value});
                  }}>
                  <MenuItem value={'true'}>Yes</MenuItem>
                  <MenuItem value={'false'}>No</MenuItem>
                </Select>
                <Select size={'small'} value={rasterConfig.resolution} variant={'standard'} fullWidth={true} sx={{height: '2rem'}}
                  onChange={(e) => {
                    handleRasterConfigChange({resolution: e.target.value});
                  }}>
                  <MenuItem value={16}>Thumbnail (16)</MenuItem>
                  <MenuItem value={32}>Ultra Low (32)</MenuItem>
                  <MenuItem value={64}>Low (64)</MenuItem>
                  <MenuItem value={128}>Medium (128)</MenuItem>
                  <MenuItem value={256}>High (256)</MenuItem>
                  <MenuItem value={512}>Ultra High (512)</MenuItem>
                </Select>
                <Stack direction={'row'} sx={{height: '2rem'}} spacing={1}>
                  <TextField size={'small'} value={rasterConfig.rasterMin} variant={'standard'} type={'number'} sx={{flexGrow: 1}}
                    InputProps={{
                      inputProps: {step: 0.02},
                      sx: {height: '2rem'},
                    }}
                    onChange={(e) => {
                      handleRasterConfigChange({rasterMin: e.target.value});
                    }}/>
                  <Typography variant={'body2'} sx={{height: '2rem', lineHeight: '2rem', textAlign: 'center'}}>to</Typography>
                  <TextField size={'small'} value={rasterConfig.rasterMax} variant={'standard'} type={'number'} sx={{flexGrow: 1}}
                    InputProps={{
                      inputProps: {step: 0.02},
                      sx: {height: '2rem'},
                    }}
                    onChange={(e) => {
                      handleRasterConfigChange({rasterMax: e.target.value});
                    }}/>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Stack direction={'row'} alignItems={'center'} sx={{userSelect: 'none'}}>
          <Typography variant={'caption'} sx={{width: '8%', height: '0.3rem', lineHeight: '0.3rem'}}>
            <code>{rasterConfig.rasterMin.toFixed(3)}</code>
          </Typography>
          <Box title={`Color Scale Legend (${rasterConfig.colorScale})`} id={'raster-legend'} sx={{
            background: `linear-gradient(to left, ${(rasterConfig.invertColorScale ? colorScaleColors.reverse() : colorScaleColors).join(',')})`,
            flexGrow: 1,
            height: '0.3rem',
          }} />
          <Typography variant={'caption'} sx={{width: '8%', height: '0.3rem', lineHeight: '0.3rem', textAlign: 'right'}}>
            <code>{rasterConfig.rasterMax.toFixed(3)}</code>
          </Typography>
        </Stack>

      </Stack>
    </Box>
  );
};

export default RasterControl;
