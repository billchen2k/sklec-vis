import React from 'react';
import {Block} from '@mui/icons-material';
import {DataMetaInfo} from '@/components/MetaInfo/DataMetaInfo';

export type DemoLineChartProps = {
  data: number[];
};

export default function DemoLineChart(props: DemoLineChartProps) {
  const margin = {top: 20, right: 20, bottom: 30, left: 50};
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  return (
    <div className="DemoLineChart">
      This is the demo line chart.
      <Block></Block>
    </div>
  );
}
