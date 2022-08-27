import * as React from 'react';
import {Route, Routes} from 'react-router-dom';
import Base from '@/layout/Base';
import DataViewer from '@/layout/DataViewer';
import DataEditor from '@/layout/DataEditor';
import DefaultPage from '@/layout/DefaultPage';
import DataCreator from '@/layout/DataCreator';

export interface IAppRoutesProps {
}

const AppRoutes = (props: IAppRoutesProps) => {
  return (
    <Routes>
      <Route path={'/'} element={<Base />}>
        <Route index element={<div />}/>
        <Route path={'/view/:datasetId'} element={<DataViewer />}/>
        <Route path={'/edit/:datasetId'} element={<DataEditor />} />
        <Route path={'/manage/create'} element={<DataCreator />} />
        <Route path={'*'} element={<DefaultPage type={'404'} showHome />}/>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
