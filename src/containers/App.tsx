import React from 'react';
import 'styles/index.scss';
import Map from 'components/Map';

function App() {
  return (
    <div className="App">
      <Map sx={{width: '100vw', height: '100vh'}}></Map>
    </div>
  );
}

export default App;
