import {useAppDispatch, useUser} from '@/app/hooks';
import TagManager from '@/components/manager/TagManager';
import {siteSlice} from '@/store/siteSlice';
import * as React from 'react';
import DefaultPage from './DefaultPage';
import LayerBox from './LayerBox';

export interface ITagManagerBoxProps {
}

export default function TagManagerBox(props: ITagManagerBoxProps) {
  const dispatch = useAppDispatch();

  const user = useUser();

  if (!user.username) {
    return <DefaultPage type={'403'} showHome />;
  }

  return (
    <LayerBox mode={'lt'}>
      <TagManager />
    </LayerBox>
  );
}
