import * as React from 'react';
import {Box} from '@mui/material';
import {flatten} from 'flat';

export interface IDataMetaTableProps {
  meta: any;
}

const DataMetaTable = (props: IDataMetaTableProps) => {
  const flattendMeta = flatten(props.meta) as any;
  const detailsRows = Object.keys(flattendMeta).map((item) => {
    return (<tr key={item}>
      <td>{item}</td>
      <td>{flattendMeta[item]}</td>
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
    <Box sx={{display: 'flex'}}>
      {detailsTable}
    </Box>
  );
};

export default DataMetaTable;
