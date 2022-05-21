/* tslint:disable */
import * as React from 'react';
import {useEffect} from 'react';
import ReactDOMServer from 'react-dom/server';
import {useMap} from 'react-leaflet';
import L from 'leaflet';
import {Edit, LocationOn, MyLocation} from '@mui/icons-material';
import {useAppDispatch, useAppSelector} from '@/app/hooks';
import {CoordinateInspectorManager} from '@/lib/map/CoordinateInspectorManager';
import {uiSlice} from '@/store/uiSlice';
import {VisualQueryManager} from '@/lib/map/VisualQueryManager';
// require('leaflet');
// require('/public/js/leaflet.label.js');
require('leaflet-toolbar/dist/leaflet.toolbar.min.js');

const MapToolbar = (props) => {
  const map = useMap();
  const dispatch = useAppDispatch();
  const {currentType, inspectState, datasetDetailCache} = useAppSelector((state) => state.site);

  // const toolbarStore = {};

  useEffect(() => {
    // if (toolbarStore.toolbar) {
    //   console.log(toolbarStore.toolbar);
    //   toolbarStore.toolbar.actions.forEach((action) => {
    //     action.disable();
    //   });
    //   toolbarStore.toolbar.remove();
    // }

    const cancelSubAction = L.Toolbar2.Action.extend({
      options: {
        toolbarIcon: {html: '<div>Cancel</div>', tooltip: 'Cancel'},
      },

      initialize: function(map, myAction) {
        this.myAction = myAction;
        L.Toolbar2.Action.prototype.initialize.call(this);
      },
      addHooks: function() {
        map.off('click');
        this.myAction.disable();
        this.disable();
      },
    });

    const locateCenterAction = L.Toolbar2.Action.extend({
      options: {
        toolbarIcon: {
          html: ReactDOMServer.renderToStaticMarkup(<MyLocation sx={{width: 16, pt: 0.5}} htmlColor={'#000000'} />),
          tooltip: 'My Current Location',
        },
      },

      addHooks: function() {
        this.name = 'locateCenterAction';
        map.locate({setView: true, maxZoom: 7});
        map.on('locationfound', (e) => {
          dispatch(uiSlice.actions.openSnackbar({
            severity: 'success',
            message: 'Location found.',
          }));
        });
        this.disable();
      },

      removeHooks: function() {
        this.manager.removeEventHooks();
        this.manager.removeLayer();
      },
    });

    const coordinateInspectAction = L.Toolbar2.Action.extend({
      options: {
        toolbarIcon: {
          html: ReactDOMServer.renderToStaticMarkup(<LocationOn sx={{width: 16, pt: 0.5}} htmlColor={'#000000'} />),
          tooltip: 'Coordinate Selector',
        },
        subToolbar: new L.Toolbar2({
          actions: [cancelSubAction],
        }),
      },

      addHooks: function() {
        this.name = 'coordinateInspectAction';
        this.manager = new CoordinateInspectorManager(map);
        this.manager.addEventHooks();
        this.manager.addLayer();
      },

      removeHooks: function() {
        this.manager.removeEventHooks();
        this.manager.removeLayer();
      },
    });

    const visualQueryAction = L.Toolbar2.Action.extend({
      options: {
        toolbarIcon: {
          html: ReactDOMServer.renderToStaticMarkup(<Edit sx={{width: 16, pt: 0.5}} htmlColor={'#000000'} />),
          tooltip: 'Visual Query',
        },
        subToolbar: new L.Toolbar2({
          actions: [cancelSubAction],
        }),
      },

      addHooks: function() {
        this.manager = new VisualQueryManager(map);
        this.manager.addEventHooks();
        this.manager.addLayer();
      },

      removeHooks: function() {
        this.manager.removeEventHooks();
        this.manager.removeLayer();
      },
    });

    const toolbar = new L.Toolbar2.Control({
      position: 'topleft',
      actions: [
        locateCenterAction,
        coordinateInspectAction,
        ...(currentType === 'RT' ? [visualQueryAction] : []),
      ],
    });
    toolbar.addTo(map);

    return () => {
      map.removeLayer(toolbar);
    };
  }, [currentType]);

  return (
    <div>
    </div>
  );
};

export default MapToolbar;
