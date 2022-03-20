/**
 * Render a line chart with Plotly.js.
 */
import React, {useDebugValue, useEffect} from 'react';
import debounce from 'lodash/debounce';
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
  Slider, Stack,
  Typography,
} from '@mui/material';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import {ClickAnnotationEvent, LayoutAxis, PlotMouseEvent, PlotSelectionEvent} from 'plotly.js';
import {
  BlurCircular,
  BlurOn,
  CenterFocusStrong, Clear,
  CompareArrows, Group, HighlightOff,
  OpenInFull,
  PlaylistAddCheck,
  PlaylistRemove,
  RotateLeft, SkipNext, SkipPrevious,
} from '@mui/icons-material';
import {muiIconToPlotlyIcon} from '@/utils';
import {downsampleAxis, downsampleValue, genYLablesGrouping} from '@/utils/chartData';
import {IGroupingResult} from '@/types';
import SKSlider, {SKThumbComponent} from '@/components/elements/SKSlider';
import useAxios from 'axios-hooks';
import axios from 'axios';
import {endpoints} from '@/config/endpoints';
import {useAppDispatch} from '@/app/hooks';
import {uiSlice} from '@/store/uiSlice';
import {getDateTimeMarks, getDateTimeByPortion} from '@/utils/datetime';

export interface ILineChartProps {
  xlabel?: string;
  type: 'csv-local' | 'csv' | 'rsk' | 'raw';
  localLink?: | string;
  visfile?: string;
}

export interface IChangablePlotConfig {
    lineWidth: number;
    showMarker: boolean;
    fullscreen: boolean;
    downSampling: number;
    downSamplingEnabled: boolean;
  };

export type IAttributeSelectorType = 'custom' | 'grouped';

const LineChart = (props: ILineChartProps) => {
  // Configs
  const axisSpacing: number = 0.05;
  const maximumYLabels: number = 9;
  const dateTimeRangeMaxValue: number = 2000;


  const dispatch = useAppDispatch();
  // States
  const [loading, setLoading] = React.useState(true);
  const [ylabels, setYlabels] = React.useState<string[]>([]);
  const [plotTitle, setPlotTitle] = React.useState(props.localLink ?/[^/]*$/.exec(props.localLink)[0]: '');
  const [activatedYlabels, setActivatedYlabels] = React.useState<string[]>([]);
  useDebugValue('activated Y labels');
  const initDataColumns: any = {};
  initDataColumns[props.xlabel] = [];
  const [dataColumns, setDataColumns] = React.useState<any>(initDataColumns);
  const [changablePlotConfig, setChangablePlotConfig] = React.useState<IChangablePlotConfig>({
    lineWidth: 1.5,
    showMarker: false,
    fullscreen: false,
    downSampling: 2,
    downSamplingEnabled: false,
  });
  const [shiftPressed, setShiftPressed] = React.useState<boolean>(false);
  const [lastSelectedLabel, setLastSelectedLabel] = React.useState<string>();
  const [highlightChartXIndex, setHighlightChartXIndex] = React.useState<number>(-1);
  const [ylabelGrouping, setYlabelGrouping] = React.useState<| IGroupingResult>(null);
  const [attributeSelectorType, setAttributeSelectorType] = React.useState<IAttributeSelectorType>('custom');
  const [selectedGroupingIndex, setSelectedGroupingIndex] = React.useState<number>(0);
  const [selectedDateTimeRange, setSelectedDateTimeRange] = React.useState<[| Date, | Date]>([null, null]);
  const [selectedDateTimeRangeIndex, setSelectedDateTimeRangeIndex] = React.useState<[number, number]>([0, dateTimeRangeMaxValue]);
  const [totalDateTimeRange, setTotalDateTimeRange] = React.useState<[| Date, | Date]>([null, null]);


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

  const handlePlotConfigChange = (config: {[key in keyof IChangablePlotConfig]?: any}) => {
    const newConfig = {...changablePlotConfig, ...config};
    setChangablePlotConfig(newConfig);
  };

  const handlePlotClicked = (e: Readonly<PlotMouseEvent>) => {
    if (changablePlotConfig.downSamplingEnabled) {
      setHighlightChartXIndex(e.points[0].pointIndex * changablePlotConfig.downSampling);
    } else {
      setHighlightChartXIndex(e.points[0].pointIndex);
    }
  };

  const handleAnnotationClicked = (e: Readonly<ClickAnnotationEvent>) => {
    setHighlightChartXIndex(-1);
  };

  const handlePlotSelected = (e: Readonly<PlotSelectionEvent>) => {
    console.log(e);
  };

  const updateSelectedDateTimeRange = React.useCallback(debounce((dateRange, selectIndex) => {
    const startTime = getDateTimeByPortion(dateRange[0], dateRange[1], selectIndex[0] / dateTimeRangeMaxValue);
    const endTime = getDateTimeByPortion(dateRange[0], dateRange[1], selectIndex[1] / dateTimeRangeMaxValue);
    console.log(startTime, endTime);
    setSelectedDateTimeRange([startTime, endTime]);
  }, 300), []);

  const handleDateTimeRangeChange = (e: Event, value: number[]) => {
    setSelectedDateTimeRangeIndex([value[0], value[1]]);
    updateSelectedDateTimeRange(totalDateTimeRange, [value[0], value[1]]);
  };

  const mapLabel2Checkboxes = (label: string) => {
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
  };

  useEffect(() => {
    addListeners();
    switch (props.type) {
      case 'csv-local':
        d3.csv(props.localLink).then((data) => {
          const fields = Object.keys(data[0]);
          const ylabels = fields.filter((field) => field !== props.xlabel);
          const activated = ylabels.slice(0, 4);
          console.log(data);

          setYlabels(ylabels);
          setActivatedYlabels(activated);
          // @ts-ignore
          setDataColumns(parseRows(data));
          setLastSelectedLabel(activated.length > 0 ? activated[0] : undefined);
          setYlabelGrouping(genYLablesGrouping(ylabels));
          setLoading(false);
        });
        break;
      case 'raw':
        // todo: Handle json files with Line charts.
        break;
    }
  }, [props.localLink, props.type]);

  useEffect(() => {
    switch (props.type) {
      case 'rsk':
        setLoading(true);
        axios(endpoints.getVisdataContent(
            props.visfile,
            true,
            selectedDateTimeRange[0],
            selectedDateTimeRange[1],
            [],
        )).then((response) => {
          const data = response.data.data;
          const fields = data.channels as string[];
          const ylabels = fields.filter((field) => field !== props.xlabel);
          const activated = ylabels.slice(0, 4);
          setYlabels(ylabels);
          setActivatedYlabels(activated);
          setDataColumns(data.vis_data);
          setYlabelGrouping(genYLablesGrouping(ylabels));
          setPlotTitle(data.file_name);
          if (!totalDateTimeRange[0]) {
            const startDate = new Date(data.vis_data[props.xlabel][0]);
            const endDate = new Date(data.vis_data[props.xlabel][data.vis_data[props.xlabel].length - 1]);
            console.log('total date time range', startDate, endDate);
            setTotalDateTimeRange([startDate, endDate]);
          }
        }).catch((error) => {
          dispatch(uiSlice.actions.openSnackbar({
            message: 'Failed to load data.' + error,
            severity: 'error',
          }));
        }).finally(() => {
          setLoading(false);
        });
        break;
    }
  }, [props.visfile, selectedDateTimeRange]);

  // /////// DRAW PLOT
  const plotFontFamily = 'Helvetica, Roboto, Arial';
  const plotFontSize = 11;


  // Aka traces
  const totalDataSize = loading || !dataColumns[props.xlabel] ? 0 : dataColumns[props.xlabel].length;
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

  let annotationLayouts: Partial<Plotly.Layout> = {};
  if (highlightChartXIndex >= 0) {
    annotationLayouts = {
      shapes: [
        {
          type: 'line',
          yref: 'paper',
          x0: dataColumns[props.xlabel][highlightChartXIndex],
          y0: 0,
          x1: dataColumns[props.xlabel][highlightChartXIndex],
          y1: 1,
          line: {
            color: '#15e7c0',
            width: 3,
          },
        },
      ],
      annotations: [
        {
          x: activatedYlabels.length > 1 ? 1 - (activatedYlabels.length - 2) * axisSpacing : 1,
          y: 1,
          yref: 'paper',
          xref: 'paper',
          xanchor: 'right',
          text: `${dataColumns[props.xlabel][highlightChartXIndex]}<br>` + activatedYlabels.map((y: string) => `${y}: ${dataColumns[y][highlightChartXIndex]}`).join('<br>'),
          showarrow: false,
          align: 'right',
          bgcolor: 'rgba(255, 255, 255, 0.8)',
        },
      ],
    };
  }

  const plotLayout: Partial<Plotly.Layout> = {
    title: activatedYlabels.length > 0 ? plotTitle : 'Please select at least 1 attribute.',
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
    ...annotationLayouts,
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
      filename: /[^/]*$/.exec(props.localLink)[0],
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
      ...(highlightChartXIndex >= 0 ? [{
        name: 'Clear Highlight',
        title: 'Clear Highlight',
        icon: muiIconToPlotlyIcon(<HighlightOff />),
        click: () => {
          setHighlightChartXIndex(-1);
        },
      }]: []),
    ],
  };

  // console.log(plotLayout, plotData);

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

  const mainPlot = (
    <Plot className={changablePlotConfig.fullscreen ? 'plotly-chart-fullscreen' : 'plotly-chart'}
      data={plotData}
      layout={plotLayout}
      config={plotConfig}
      useResizeHandler={true}
      onClick={handlePlotClicked}
      onDoubleClick={() => setHighlightChartXIndex(-1)}
      onClickAnnotation={handleAnnotationClicked}
      onSelected={handlePlotSelected}
    />
  );

  const CustomSelector = () => {
    const checkBoxes = ylabels.map(mapLabel2Checkboxes);
    return (<Box>
      <FormControl component={'fieldset'} variant={'standard'}>
        <FormGroup row={true}>
          {checkBoxes}
        </FormGroup>
      </FormControl>
      <Typography variant={'body2'} color={'gray'}>
          You can hold shift while selecting to select / deselect multiple attributes.<br />
          Use the focus icon before the attributes to focus on a specific attribute.
      </Typography>
    </Box>);
  };


  const GroupedSelector = () => {
    if (!ylabelGrouping) {
      return (
        <Typography variant={'body1'} sx={{mt: 1}}>
        Current dataset does not support grouping. Please use the custom attribute selector for data navigating.
        </Typography>
      );
    }
    const ungroupedCheckboxes = ylabelGrouping.ungrouped.map(mapLabel2Checkboxes);
    const grouped = ylabelGrouping.grouped;
    const handleGroupSelectionChange = (e: Event, value: number) => {
      if (value < 0 || value > grouped.length - 1) {
        return;
      }
      const oldGroup = grouped[selectedGroupingIndex];
      const newGroup = grouped[value];
      const handledLabels = activatedYlabels;
      oldGroup.labels.forEach((label) => {
        const index = handledLabels.indexOf(label);
        if (index >= 0) {
          activatedYlabels.splice(index, 1);
        }
      });
      newGroup.labels.forEach((label) => {
        const index = handledLabels.indexOf(label);
        if (index < 0) {
          handledLabels.push(label);
        }
      });
      setSelectedGroupingIndex(value);
      setActivatedYlabels(handledLabels);
    };

    return (<Box>
      <FormControl component={'fieldset'} variant={'standard'}>
        <FormGroup row={true}>
          {ungroupedCheckboxes}
        </FormGroup>
      </FormControl>
      <Typography variant={'body2'} color={'gray'}>
          You can hold shift while selecting to select / deselect multiple attributes.<br />
          Use the focus icon before the attributes to focus on a specific attribute.
      </Typography>
      <Typography variant={'body2'} sx={{fontWeight: 'bold', mt: 1}}>
          Grouped attributes:
      </Typography>
      <Stack direction={'row'} spacing={1} alignItems={'center'}>
        <Typography variant={'body2'} sx={{width: '150px'}}>Select attribute group:</Typography>
        <Slider
          value={selectedGroupingIndex}
          min={0}
          max={grouped.length - 1}
          step={1}
          size={'medium'}
          onChange={handleDateTimeRangeChange}
          valueLabelDisplay={'auto'}
          marks={true}
        />
      </Stack>
      <Stack direction={'row'} spacing={1} alignItems={'center'}>
        <Typography variant={'body2'} sx={{width: '150px'}}>Now Displaying:</Typography>
        <Typography variant={'body1'}>{grouped[selectedGroupingIndex].name}: <b>{grouped[selectedGroupingIndex].labels.join(', ')}</b></Typography>
        <Box sx={{flexGrow: 1}} />
        <ButtonGroup size={'small'} variant={'outlined'}>
          <Button onClick={() => handleGroupSelectionChange(null, selectedGroupingIndex - 1)} startIcon={<SkipPrevious />}
            disabled={selectedGroupingIndex === 0}
          >
            Last Group
          </Button>
          <Button onClick={() => handleGroupSelectionChange(null, selectedGroupingIndex + 1)} startIcon={<SkipNext />}
            disabled={selectedGroupingIndex === grouped.length - 1}
          >
            Next Group</Button>
        </ButtonGroup>
      </Stack>
    </Box>);
  };


  return (
    <Box>
      <Typography variant={'subtitle2'} >
        Plot Configurations:
      </Typography>
      <Box id={'container-plot-control'}>
        <Grid container spacing={1}>
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
          <Grid item xs={12}>
            <Box sx={{px: 6, height: 50}}>
              {totalDateTimeRange[0] && totalDateTimeRange[1] &&
                 <SKSlider
                   min={0}
                   disabled={loading}
                   max={dateTimeRangeMaxValue}
                   onChange={handleDateTimeRangeChange}
                   value={[selectedDateTimeRangeIndex[0], selectedDateTimeRangeIndex[1]]}
                   step={1}
                   valueLabelDisplay={'auto'}
                   valueLabelFormat={(value) => getDateTimeByPortion(totalDateTimeRange[0], totalDateTimeRange[1], value / dateTimeRangeMaxValue).toISOString()}
                   marks={getDateTimeMarks(totalDateTimeRange[0], totalDateTimeRange[1], 7, dateTimeRangeMaxValue)}
                 />
              }
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Box id={'chart-container'} sx={{border: 'solid 1px #999999', borderRadius: '2px'}}>
        {mainPlot}
      </Box>
      {loading &&
        <LinearProgress variant={'indeterminate'} sx={{width: '100%'}}/>
      }
      {/* Visualization Controller */}
      <Box sx={{display: 'flex', flexDirection: 'column', mt: '1rem'}}>

        <Stack direction={'row'} spacing={1} alignItems={'center'}>
          <Select size={'small'}
            value={attributeSelectorType}
            onChange={(e) => setAttributeSelectorType(e.target.value as IAttributeSelectorType)}>
            <MenuItem value={'custom'}>Custom Selector</MenuItem>
            <MenuItem value={'grouped'}>Groupped Selector</MenuItem>
          </Select>
          <Typography variant={'subtitle2'}>
                Attributes to Display
            {activatedYlabels.length == maximumYLabels ? ` (Maximum of ${maximumYLabels} attributes can be displayed at a time)` : ''}
                :
          </Typography>
          <Box sx={{flexGrow: 1}} />

          <ButtonGroup size={'small'} variant={'outlined'} color={'primary'}>
            <Button onClick={() => handleSelectAll()}><PlaylistAddCheck/> Select All</Button>
            <Button onClick={() => handleDeselectAll()}><PlaylistRemove/> Deselect All</Button>
            <Button onClick={() => handleInvertSelection()}><CompareArrows /> Invert Selection</Button>
          </ButtonGroup>
        </Stack>

        {attributeSelectorType === 'custom' && <CustomSelector />}
        {attributeSelectorType === 'grouped' && <GroupedSelector />}

      </Box>
    </Box>
  );
};

export default LineChart;


