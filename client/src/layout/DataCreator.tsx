
import DatasetCreator from '@/components/manager/DatasetCreator';
import * as React from 'react';
import LayerBox from './LayerBox';

export interface IDataCreatorProps {
}

export default function DataCreator(props: IDataCreatorProps) {
  return (
    <LayerBox mode={'lt'}>
      <DatasetCreator />
    </LayerBox>
  );
}
