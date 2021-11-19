import * as React from 'react';

import {Card, CardContent, CardHeader, Typography} from '@mui/material';

type DataMetaInfoProps = {
  datasetName?: string;
  meta: any;
};

type DataMetaInfoState = {
  visible: boolean;
};

export class DataMetaInfo extends React.Component<DataMetaInfoProps, DataMetaInfoState> {
  constructor(props: DataMetaInfoProps) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  render() {
    const detailsDom = Object.keys(this.props.meta).map((item) => {
      return (<p key={item}>
        <code>{item}: {this.props.meta[item]}</code>
      </p>);
    });

    return (
      <Card>
        <CardContent>
          <Typography variant='body2'>
            <b>{this.props.datasetName}</b>
          </Typography>
          {detailsDom}
        </CardContent>
      </Card>
    );
  }
}
