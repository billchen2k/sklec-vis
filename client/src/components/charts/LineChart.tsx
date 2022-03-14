/**
 * Render a line chart with Plotly.js.
 */
import React, {useDebugValue, useEffect} from 'react';
import * as d3 from 'd3';
import {DSVRowArray} from 'd3';
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton, LinearProgress, MenuItem, Select,
  Slider,
  Typography,
} from '@mui/material';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import {LayoutAxis} from 'plotly.js';
import {
  CenterFocusStrong,
  CompareArrows,
  OpenInFull,
  PlaylistAddCheck,
  PlaylistRemove,
  RotateLeft,
} from '@mui/icons-material';
import {downsampleAxis, downsampleValue, muiIconToPlotlyIcon} from '@/utils';


export interface ILineChartProps {
  xlabel?: string;
  type: 'csv' | 'raw';
  link: | string
}

export interface IChangablePlotConfig {
    lineWidth: number;
    showMarker: boolean;
    fullscreen: boolean;
    downSampling: number;
    downSamplingEnabled: boolean;
  };

const LineChart = (props: ILineChartProps) => {
  const [loading, setLoading] = React.useState(true);
  const [ylabels, setYlabels] = React.useState<string[]>([]);
  const [activatedYlabels, setActivatedYlabels] = React.useState<string[]>([]);
  useDebugValue('activated Y labels');
  const [dataColumns, setDataColumns] = React.useState<any>({});
  const [changablePlotConfig, setChangablePlotConfig] = React.useState<IChangablePlotConfig>({
    lineWidth: 1.5,
    showMarker: false,
    fullscreen: false,
    downSampling: 2,
    downSamplingEnabled: false,
  });
  const [shiftPressed, setShiftPressed] = React.useState<boolean>(false);
  const [lastSelectedLabel, setLastSelectedLabel] = React.useState<string>();

  const axisSpacing: number = 0.05;
  const maximumYLabels: number = 9;

  const parseRows = (d3data: DSVRowArray<string>) => {
    const dataRows: {[key: string]: string[]} = {};
    for (let i = 0; i < d3data.length; i++) {
      const row = d3data[i];
      for (const key of Object.keys(row)) {
        if (dataRows[key] === undefined) {
          dataRows[key] = [];
        }
        dataRows[key].push(row[key]);
      }
    }
    return dataRows;
  };

  const addListeners = () => {
    window.addEventListener('keydown', (e) => {
      if (e.shiftKey) {
        setShiftPressed(true);
      }
    });
    window.addEventListener('keyup', (e) => {
      if (!e.shiftKey) {
        setShiftPressed(false);
      }
    });
  };

  const handleCheckboxChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const activated = activatedYlabels;
    if (event.target.checked) {
      activated.push(event.target.name);
    } else {
      activated.splice(activated.indexOf(event.target.name), 1);
    }
    // Record last selected attributes.
    if (!lastSelectedLabel) {
      setLastSelectedLabel(event.target.name);
    }
    // Valid Multiple Selection
    if (lastSelectedLabel && shiftPressed) {
      const beginIndex = ylabels.indexOf(lastSelectedLabel);
      const endIndex = ylabels.indexOf(event.target.name);
      const lastSelected = activatedYlabels.indexOf(lastSelectedLabel) !== -1;
      if (Math.abs(endIndex - beginIndex) > 1) {
        for (let i = Math.min(beginIndex, endIndex) + 1; i <= Math.max(beginIndex, endIndex); i++) {
          if (lastSelected && activated.indexOf(ylabels[i]) === -1) {
            activated.push(ylabels[i]);
          } else if (!lastSelected && activated.indexOf(ylabels[i]) !== -1) {
            activated.splice(activated.indexOf(ylabels[i]), 1);
          }
        }
      }
    }
    setActivatedYlabels(activated.slice(0, maximumYLabels));
    setLastSelectedLabel(event.target.name);
  };

  const handleFocusClicked = (event: React.MouseEvent<HTMLButtonElement>, label: string) => {
    event.preventDefault();
    setActivatedYlabels([label]);
    setLastSelectedLabel(label);
  };

  const handleSelectAll = () => {
    setActivatedYlabels(ylabels.slice(0, maximumYLabels));
  };

  const handleDeselectAll = () => {
    setActivatedYlabels([]);
  };

  const handleInvertSelection = () => {
    const activated = activatedYlabels;
    const inverted = ylabels.filter((label) => !activated.includes(label));
    setActivatedYlabels(inverted.slice(0, maximumYLabels));
  };

  const changeDownsamplingChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.checked) {
      handlePlotConfigChange({downSampling: 0});
    }
  };

  const handlePlotConfigChange = (config: {[key in keyof IChangablePlotConfig]?: any}) => {
    const newConfig = {...changablePlotConfig, ...config};
    setChangablePlotConfig(newConfig);
  };

  useEffect(() => {
    addListeners();
    switch (props.type) {
      case 'csv':
        d3.csv(props.link).then((data) => {
          const fields = Object.keys(data[0]);
          const ylabels = fields.filter((field) => field !== props.xlabel);
          const activated = ylabels.slice(0, 4);
          setYlabels(ylabels);
          setActivatedYlabels(activated);
          // @ts-ignore
          setDataColumns(parseRows(data));
          setLastSelectedLabel(activated.length > 0 ? activated[0] : undefined);
        });
        setTimeout(() => {
          setLoading(false);
        }, 1000);
        break;
      case 'raw':
        // todo: Handle json files with Line charts.
        break;
    }
  }, [props.link, props.type]);

  // /////// DRAW PLOT
  const plotFontFamily = 'Helvetica, Roboto, Arial';
  const plotFontSize = 11;


  // Aka traces
  const plotData: Plotly.Data[] = activatedYlabels.map((y: string, index) => {
    const trace: Plotly.Data = {
      x: changablePlotConfig.downSamplingEnabled ? downsampleAxis(dataColumns[props.xlabel], changablePlotConfig.downSampling) : dataColumns[props.xlabel],
      y: changablePlotConfig.downSamplingEnabled ? downsampleValue(dataColumns[y], changablePlotConfig.downSampling) : dataColumns[y],
      name: y,
      type: 'scatter',
      mode: changablePlotConfig.showMarker ? 'lines+markers' : 'lines',
      line: {
        width: changablePlotConfig.lineWidth,
      },
      marker: {
        size: changablePlotConfig.lineWidth * 3,
      },
    };
    trace.yaxis = index > 0 ? `y${index + 1}` : `y`;
    return trace;
  });

  const plotLayout: Partial<Plotly.Layout> = {
    title: activatedYlabels.length > 0 ? /[^/]*$/.exec(props.link)[0] : 'Please select at least 1 attribute.',
    xaxis: {
      title: props.xlabel,
      domain: [0, activatedYlabels.length <= 2 ? 1 : 1 - (activatedYlabels.length - 2) * axisSpacing],
      linecolor: 'gray',
      linewidth: 1,
      mirror: true,
    },
    font: {
      family: plotFontFamily,
      size: plotFontSize,
    },
    autosize: true,
    legend: {
      x: 0,
      y: 1,
      traceorder: 'normal',
      bgcolor: 'RGBA(255, 255, 255, 0.3)',
    },
  };

  for (let i = 0; i < activatedYlabels.length; i++) {
    let yaxis: Partial<LayoutAxis>;
    if (i == 0) {
      yaxis = {
        title: activatedYlabels[i],
        linecolor: 'gray',
        linewidth: 1,
        mirror: true,
      };
    } else {
      yaxis = {
        title: activatedYlabels[i],
        overlaying: 'y',
        position: 1 - (i - 1) * axisSpacing,
        side: 'right',
        linewidth: 1,
        autotick: true,
      };
    }
    const axis = (i == 0) ? 'yaxis' : `yaxis${i + 1}`;
    // @ts-ignore
    plotLayout[axis] = yaxis;
  }
  const plotConfig: Partial<Plotly.Config> = {
    autosizable: true,
    toImageButtonOptions: {
      format: 'svg',
      filename: /[^/]*$/.exec(props.link)[0],
      height: 600,
      width: 800,
    },
    displaylogo: false,
    modeBarButtonsToAdd: [
      {
        name: 'Fullscreen',
        title: 'Toggle Fullscreen',
        icon: muiIconToPlotlyIcon(<OpenInFull />),
        click: () => {
          handlePlotConfigChange({fullscreen: !changablePlotConfig.fullscreen});
        },
      },
    ],
  };

  console.log(plotLayout, plotData);

  const checkBoxes = ylabels.map((label) => {
    const checked = activatedYlabels.indexOf(label) > -1;
    const disabled = activatedYlabels.length == 9 && !checked;
    return (
      <Box key={label} sx={{
        borderRadius: '3px',
        backgroundColor: shiftPressed && label === lastSelectedLabel ? '#d1ff96' : undefined,
        transition: 'all 0.2s',
      }}>
        <IconButton onClick={(e) => handleFocusClicked(e, label)}>
          <CenterFocusStrong/>
        </IconButton>
        <FormControlLabel control={
          <Checkbox checked={checked}
            disabled={disabled}
            onChange={(e) => handleCheckboxChanged(e)}
            name={label}/>
        } label={checked ? <b>{label}</b> : label}/>
      </Box>
    );
  });


  const lineWidthSlider = (
    <Slider
      id={'slider-line-width'}
      defaultValue={1}
      value={changablePlotConfig.lineWidth}
      valueLabelDisplay={'auto'}
      step={0.1}
      min={0.2}
      max={5}
      size={'small'}
      onChange={(e, value: number) => handlePlotConfigChange({lineWidth: value})}
    />
  );

  const downsamplingSlider = (
    <Slider
      id={'slider-downsampling'}
      defaultValue={0}
      value={changablePlotConfig.downSampling}
      valueLabelDisplay={'auto'}
      step={1}
      min={1}
      max={dataColumns[props.xlabel] ? Math.floor(Math.log2(dataColumns[props.xlabel].length)) : 10}
      size={'small'}
      disabled={!changablePlotConfig.downSamplingEnabled}
      onChange={(e, value: number) => handlePlotConfigChange({downSampling: value})}
    />
  );


  return (
    <Box>
      <Typography variant={'subtitle2'} >
        Plot Configurations:
      </Typography>
      <Box id={'container-plot-control'}>
        <Grid container spacing={3}>
          <Grid item container xs={4} sx={{'mt': 1}}>
            <Grid item xs={3}>
              <Typography variant={'subtitle1'}>
                Line Width:
              </Typography>
            </Grid>
            <Grid item xs={8}>
              {lineWidthSlider}
            </Grid>
            <Grid item xs={1}>
              <IconButton size={'small'} onClick={() => handlePlotConfigChange({lineWidth: 1})}>
                <RotateLeft/>
              </IconButton>
            </Grid>
          </Grid>
          <Grid item xs={4}>
            <FormControlLabel control={
              <Checkbox checked={changablePlotConfig.showMarker}
                value={changablePlotConfig.showMarker}
                onChange={(e) => handlePlotConfigChange({showMarker: e.target.checked})}
                name={'showMarker'}/>
            } label={'Show Marker (May affect performance)'}/>
          </Grid>
          <Grid item xs={4}>
            <Grid item container >
              <Grid item xs={4}>
                <FormControlLabel control={
                  <Checkbox
                    value={changablePlotConfig.downSamplingEnabled}
                    onChange={(e) => handlePlotConfigChange({downSamplingEnabled: e.target.checked})}
                    name={'showMarker'}/>
                } label={'DownSampling'}/>
              </Grid>
              <Grid item xs={8} sx={{'mt': 1}}>
                {downsamplingSlider}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      <Box id={'chart-container'} sx={{border: 'solid 1px #999999', borderRadius: '2px'}}>
        <Plot className={changablePlotConfig.fullscreen ? 'plotly-chart-fullscreen' : 'plotly-chart'}
          data={plotData}
          layout={plotLayout}
          config={plotConfig}
          useResizeHandler={true}
        />
      </Box>
      {loading &&
        <LinearProgress variant={'indeterminate'} sx={{width: '100%'}}/>
      }
      {/* Visualization Controller */}
      <Box sx={{display: 'flex', flexDirection: 'column', mt: '1rem'}}>
        <Grid container justifyContent={'space-between'} spacing={2}>
          <Grid item key={'label'}>
            <Typography variant={'subtitle2'}>
                Attributes to Display
              {activatedYlabels.length == maximumYLabels ? ` (Maximum of ${maximumYLabels} attributes can be displayed at a time)` : ''}
                :
            </Typography>
          </Grid>
          <Grid item key={'button-groups'}>
            <ButtonGroup size={'small'} variant={'outlined'} color={'primary'}>
              <Button onClick={() => handleSelectAll()}><PlaylistAddCheck/> Select All</Button>
              <Button onClick={() => handleDeselectAll()}><PlaylistRemove/> Deselect All</Button>
              <Button onClick={() => handleInvertSelection()}><CompareArrows /> Invert Selection</Button>
            </ButtonGroup>
          </Grid>
        </Grid>
        <FormControl component={'fieldset'} variant={'standard'}>
          <FormGroup row={true}>
            {checkBoxes}
          </FormGroup>
        </FormControl>
        <Typography variant={'body2'} color={'gray'}>
          You can hold shift while selecting to select / deselect multiple attributes.<br />
          Use the focus icon before the attributes to focus on a specific attribute.
        </Typography>
      </Box>
    </Box>
  );
};

export default LineChart;


