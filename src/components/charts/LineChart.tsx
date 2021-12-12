/**
 * Render a line chart with Plotly.js.
 */
import React from 'react';
import * as d3 from 'd3';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormGroup,
  Checkbox,
  FormLabel,
  Button,
  Typography,
  IconButton, Grid, ButtonGroup, Slider, Stack, InputLabel,
} from '@mui/material';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import {DSVRowArray, lab} from 'd3';
import {LayoutAxis} from 'plotly.js';
import {
  CenterFocusStrong,
  PlaylistAddCheck,
  PlaylistRemove,
  Replay,
  Refresh,
  RotateLeft,
  CompareArrows,
  OpenInFull,
} from '@mui/icons-material';
import {renderToStaticMarkup} from 'react-dom/server';
import {muiIconToPlotlyIcon} from '@/utils';

interface LineChartProps {
  xlabel?: string;
  type: 'csv' | 'json';
  link: | string
};

interface LineChartStates {
  plotData: | Plotly.Data[];
  plotLayout: | Partial<Plotly.Layout>;
  plotConfig: | Partial<Plotly.Config>;
  ylabels: string[] ;
  activatedYlabels: string[];
  dataColumns: {[key: string]: string[]};
  changablePlotConfig?: {
    lineWidth: number;
    showMarker: boolean;
    fullscreen: boolean;
  };
};

class LineChart extends React.Component<LineChartProps, LineChartStates> {
  constructor(props: LineChartProps, states: LineChartStates) {
    super(props, states);
    this.state = {
      plotData: [],
      plotLayout: {},
      plotConfig: {},
      ylabels: [],
      activatedYlabels: [],
      dataColumns: {},
      changablePlotConfig: {
        lineWidth: 1,
        showMarker: false,
        fullscreen: false,
      },
    };
  }

  updatePlot(ylabels?: string[]) {
    const plotFontFamily = 'Helvetica, Roboto, Arial';
    const plotFontSize = 11;
    if (!ylabels) {
      ylabels = this.state.activatedYlabels;
    }
    // Only a maximum number of 9 columns can display in a same plot.
    ylabels.splice(9);

    const traces: Plotly.Data[] = ylabels.map((y: string) => {
      const trace: Plotly.Data = {
        x: this.state.dataColumns[this.props.xlabel],
        y: this.state.dataColumns[y],
        name: y,
        type: 'scatter',
        mode: this.state.changablePlotConfig.showMarker ? 'lines+markers' : 'lines',
        line: {
          width: this.state.changablePlotConfig.lineWidth,
        },
        marker: {
          size: this.state.changablePlotConfig.lineWidth * 3,
        },
      };
      if (ylabels.indexOf(y) > 0) {
        trace.yaxis = `y${ylabels.indexOf(y) + 1}`;
      }
      return trace;
    });

    const layout: Partial<Plotly.Layout> = {
      title: ylabels.length > 0 ? /[^/]*$/.exec(this.props.link)[0] : 'Please select at least 1 attribute.',
      xaxis: {
        title: this.props.xlabel,
        domain: [0, ylabels.length <= 2 ? 1 : 1 - (ylabels.length - 2) * 0.06],
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
    for (let i = 0; i < ylabels.length; i++) {
      let yaxis: Partial<LayoutAxis>;
      if (i == 0) {
        yaxis = {
          title: ylabels[i],
          linecolor: 'gray',
          linewidth: 1,
          mirror: true,
        };
      } else {
        yaxis = {
          title: ylabels[i],
          overlaying: 'y',
          position: 1 - (i - 1) * 0.06,
          side: 'right',
          linewidth: 1,
          autotick: true,
        };
      }
      const axis = (i == 0) ? 'yaxis' : `yaxis${i + 1}`;
      // @ts-ignore
      layout[axis] = yaxis;
    }
    const config: Partial<Plotly.Config> = {
      autosizable: true,
      toImageButtonOptions: {
        format: 'svg',
        filename: /[^/]*$/.exec(this.props.link)[0],
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
            this.setState({
              changablePlotConfig: {
                ...this.state.changablePlotConfig,
                fullscreen: !this.state.changablePlotConfig.fullscreen,
              },
            });
            this.updatePlot();
          },
        },
      ],
    };

    this.setState({
      plotData: traces,
      plotLayout: layout,
      plotConfig: config,
      activatedYlabels: ylabels,
    });
  }

  parseRows(d3data: DSVRowArray<string>) {
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
  }

  componentDidMount() {
    switch (this.props.type) {
      case 'csv':
        d3.csv(this.props.link).then((data) => {
          const fields = Object.keys(data[0]);
          const ylabels = fields.filter((field) => field !== this.props.xlabel);
          const activated = ylabels.slice(0, 4);
          this.setState({
            ylabels: ylabels,
            activatedYlabels: activated,
            dataColumns: this.parseRows(data),
          });
        });
        break;
      case 'json':
        //todo: Handle json files with Line Charts.
        break;
    }
    setTimeout(() => {
      this.updatePlot();
    }, 200);
  }

  handleCheckboxChanged(event: React.ChangeEvent<HTMLInputElement>) {
    const activated = this.state.activatedYlabels;
    if (event.target.checked) {
      activated.push(event.target.name);
    } else {
      activated.splice(activated.indexOf(event.target.name), 1);
    }
    this.setState({
      activatedYlabels: activated,
    });
    this.updatePlot(activated);
  }

  handleFocusClicked(event: React.MouseEvent<HTMLButtonElement>, label: string) {
    event.preventDefault();
    this.updatePlot([label]);
  }

  handleSelectAll() {
    this.updatePlot([...this.state.ylabels]);
  }

  handleDeselectAll() {
    this.updatePlot([]);
  }

  handleInvertSelection() {
    const activated = this.state.activatedYlabels;
    const inverted = this.state.ylabels.filter((label) => !activated.includes(label));
    this.updatePlot(inverted);
  }

  handlePlotConfigChange(config: {[key in keyof LineChartStates['changablePlotConfig']]?: any}) {
    this.setState({
      changablePlotConfig: {
        ...this.state.changablePlotConfig,
        ...config,
      },
    });
    setTimeout(() => {
      this.updatePlot();
    }, 100);
  }

  render() {
    const checkBoxs = this.state.ylabels.map((label) => {
      return (
        <span>
          <IconButton onClick={(e) => this.handleFocusClicked(e, label)}>
            <CenterFocusStrong/>
          </IconButton>
          <FormControlLabel key={label} control={
            <Checkbox checked={this.state.activatedYlabels.indexOf(label) > -1}
                      onChange={(e) => this.handleCheckboxChanged(e)}
                      name={label}/>
          } label={label}/>
        </span>
      );
    });
    const lineWidthSlider = (
      <Slider
        id={'slider-line-width'}
        defaultValue={1}
        value={this.state.changablePlotConfig.lineWidth}
        valueLabelDisplay={'auto'}
        step={0.1}
        min={0.2}
        max={5}
        size={'small'}
        onChange={(e, value: number) => this.handlePlotConfigChange({lineWidth: value})}
      />
    );
    return (<div>
      <Box id={'chart-container'} sx={{border: 'solid 1px #999999', borderRadius: '2px'}}>
        <Plot className={this.state.changablePlotConfig.fullscreen ? 'plotly-chart-fullscreen' : 'plotly-chart'}
              data={this.state.plotData}
              layout={this.state.plotLayout}
              config={this.state.plotConfig}/>
      </Box>
      {/* Visualization Controller */}
      <Box sx={{display: 'flex', flexDirection: 'column', mt: '1rem'}}>
        <FormControl component={'fieldset'} variant={'standard'}>
          <Grid container justifyContent={'space-between'} spacing={2}>
            <Grid item key={'label'}>
              <Typography variant={'subtitle2'}>
                Attributes to Display (Maximum of 9 attributes can be displayed at a time):
              </Typography>
            </Grid>
            <Grid item key={'button-groups'}>
              <ButtonGroup size={'small'} variant={'outlined'} color={'primary'}>
                <Button onClick={() => this.handleSelectAll()}><PlaylistAddCheck/> Select All</Button>
                <Button onClick={() => this.handleDeselectAll()}><PlaylistRemove/> Deselect All</Button>
                <Button onClick={() => this.handleInvertSelection()}><CompareArrows /> Invert Selection</Button>
              </ButtonGroup>
            </Grid>
          </Grid>
          <FormGroup row={true}>
            {checkBoxs}
          </FormGroup>
        </FormControl>
      </Box>
      <Typography variant={'subtitle2'} sx={{mt: 3}}>
        Plot Configurations:
      </Typography>
      <Box>
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
              <IconButton size={'small'} onClick={() => this.handlePlotConfigChange({lineWidth: 1})}>
                <RotateLeft/>
              </IconButton>
            </Grid>
          </Grid>
          <Grid item xs={4}>
            <FormControlLabel control={
              <Checkbox checked={this.state.changablePlotConfig.showMarker}
                        onChange={(e) => this.handlePlotConfigChange({showMarker: e.target.checked})}
                        name={'showMarker'}/>
            } label={'Show Marker (May affect performance)'}/>
          </Grid>
          <Grid item xs={4}>
            <FormControlLabel control={
              <Checkbox
                        onChange={(e) => this.handlePlotConfigChange({showMarker: e.target.checked})}
                        name={'showMarker'}/>
            } label={'DownSampling'}/>
          </Grid>
        </Grid>
      </Box>
    </div>);
  }
}

export default LineChart;
