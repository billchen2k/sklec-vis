import * as React from 'react';
import {Box} from '@mui/material';

export interface IDataMetaTableProps {
  meta: any;
}

const DataMetaTable = (props: IDataMetaTableProps) => {
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
    <Box sx={{display: 'flex'}}>
      {detailsTable}
    </Box>
  );
};

export default DataMetaTable;
