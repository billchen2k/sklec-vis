import * as React from 'react';
import {Box, Button} from '@mui/material';

import {Card, CardActions, CardContent, CardHeader, Typography} from '@mui/material';

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
    const detailsRows = Object.keys(this.props.meta).map((item) => {
      return (<tr key={item}>
        <td>{item}</td>
        <td>{this.props.meta[item]}</td>
      </tr>);
    });
    const detailsTable = (<table className={'meta-table'}>
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {detailsRows}
      </tbody>
    </table>);

    return (
      <Box>
        <Card variant={'outlined'}>
          <CardContent>
            <Box sx={{display: 'flex'}}>
              {detailsTable}
            </Box>
          </CardContent>
        </Card>
        <Box sx={{margin: '6px'}} className={'clearfix'}>
          <Button sx={{float: 'right'}} size={'small'} variant={'outlined'}>Download</Button>
        </Box>
      </Box>
    );
  }
}
