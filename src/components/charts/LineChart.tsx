/**
 * Render a line chart with Plotly.js.
 */
import React from 'react';
import * as d3 from 'd3';
import {Box} from '@mui/material';
import {Config, TopLevelSpec, compile} from 'vega-lite';
import {VegaLite, VisualizationSpec} from 'react-vega';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import {DSVRowArray} from 'd3';

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
        mode: 'lines',
        line: {
          width: 1,
        },
        // marker: {
        //   color: '#00ff00',
        // },
      };
      if (ylabels.indexOf(y) > 0) {
        trace.yaxis = `y${ylabels.indexOf(y) + 1}`;
      }
      return trace;
    });
    const layout: Partial<Plotly.Layout> = {
      title: /[^/]*$/.exec(this.props.link)[0],
      xaxis: {
        title: this.props.xlabel,
        domain: [0, 1 - (ylabels.length - 1) * 0.08],
      },
      font: {
        family: plotFontFamily,
        size: plotFontSize,
      },
      autosize: true,
    };
    for (let i = 0; i < ylabels.length; i++) {
      const axis = (i == 0) ? 'yaxis' : `yaxis${i + 1}`;
      if (i == 0) {
        layout.yaxis = {
          title: ylabels[i],
        };
      }
      else {
        const axis = `yaxis${i + 1}`;
        // @ts-ignore
        layout[axis] = {
          title: ylabels[i],
          overlaying: 'y',
          side: 'right',
          position: 1 - (i - 1) * 0.08,
        };
      }
    }
    const config: Partial<Plotly.Config> = {
      autosizable: true,
    };
    this.setState({
      plotData: traces,
      plotLayout: layout,
      plotConfig: config,
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
          const activated = [ylabels[0], ylabels[1], ylabels[2], ylabels[3]];
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

  render() {
    return (<Box id={'chart-container'} sx={{border: 'solid 1px #999999', borderRadius: '2px'}}>
      <Plot className={'plotly-chart'}
        data={this.state.plotData}
        layout={this.state.plotLayout}
        config={this.state.plotConfig}/>
    </Box>);
  }
}

export default LineChart;
