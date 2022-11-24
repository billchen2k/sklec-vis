import * as React from 'react';
import {Box} from '@mui/material';
import {flatten} from 'flat';

export interface IDataMetaTableProps {
  meta: any;
}

const DataMetaTable = (props: IDataMetaTableProps) => {
  // console.log(props.meta);
  const flattendMeta = flatten(props.meta || {}) as any;
  const excludedFileds = ['variables', 'dimensions'];
  const detailsRows = Object.keys(flattendMeta || {})?.map((item) => {
    let outputKey: string = item;
    let rootKey: string = item;
    if (item.includes('.')) {
      outputKey = item.split('.').slice(-1)[0];
      rootKey = item.split('.')[0];
    }

    if (excludedFileds.includes(rootKey)) {
      return null;
    }
    return (<tr key={item}>
      <td>{outputKey}</td>
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
