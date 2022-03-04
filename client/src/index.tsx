import React from 'react';
import ReactDOM from 'react-dom';
import '@/styles/index.scss';
import App from '@/app/App';
// import reportWebVitals from './reportWebVitals';

ReactDOM.render(
    <React.StrictMode>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
      />
      <App />
    </React.StrictMode>,
    document.getElementById('root'),
    () => {
      console.log('App finished loading.');
    },
);
