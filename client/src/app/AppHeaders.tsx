import * as React from 'react';

export interface IAppHeadersProps {
}

const AppHeaders = (props: IAppHeadersProps) => {
  return (
    <div>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
      />
    </div>
  );
};

export default AppHeaders;
