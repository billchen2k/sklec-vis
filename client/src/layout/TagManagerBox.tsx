import TagManager from '@/components/manager/TagManager';
import * as React from 'react';
import LayerBox from './LayerBox';

export interface ITagManagerBoxProps {
}

export default function TagManagerBox(props: ITagManagerBoxProps) {
  return (
    <LayerBox mode={'lt'}>
      <TagManager />
    </LayerBox>
  );
}
