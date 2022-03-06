import * as React from 'react';
import {Box, Button} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Card, CardActions, CardContent, CardHeader, Typography} from '@mui/material';

export interface IDataMetaInfoProps {
  datasetName?: string;
  meta: any;
  mini?: boolean;
}

const DataMetaInfo = (props: IDataMetaInfoProps) => {
  const navigate = useNavigate();

  const detailsRows = Object.keys(props.meta).map((item) => {
    return (<tr key={item}>
      <td>{item}</td>
      <td>{props.meta[item]}</td>
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
        <Button sx={{float: 'right'}} size={'small'} variant={'outlined'}
          onClick={() => {
            navigate('/view', {replace: true});
          }}
        >View</Button>
      </Box>
    </Box>
  );
};

export default DataMetaInfo;
